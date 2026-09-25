"""
Model Architecture and Loading Module for LowKeySigns
Constructs the 1D-CNN + Transformer Backbone (~1.836M parameters)
Loads weights from HDF5 file and packages into an end-to-end TFLiteModel.
"""

import time
from pathlib import Path
from typing import Optional, Dict, Any, List

import numpy as np
import tensorflow as tf

from ..preprocessing.tf_preprocess import Preprocess, MAX_LEN, CHANNELS, NUM_CLASSES
from ..config.settings import settings


class ECA(tf.keras.layers.Layer):
    """Efficient Channel Attention (ECA) Layer."""

    def __init__(self, kernel_size: int = 5, **kwargs):
        super().__init__(**kwargs)
        self.supports_masking = True
        self.kernel_size = kernel_size
        self.conv = tf.keras.layers.Conv1D(
            1, kernel_size=kernel_size, strides=1, padding="same", use_bias=False
        )

    def call(self, inputs, mask=None):
        nn = tf.keras.layers.GlobalAveragePooling1D()(inputs, mask=mask)
        nn = tf.expand_dims(nn, -1)
        nn = self.conv(nn)
        nn = tf.squeeze(nn, -1)
        nn = tf.nn.sigmoid(nn)
        nn = nn[:, None, :]
        return inputs * nn


class LateDropout(tf.keras.layers.Layer):
    """Applies dropout conditionally after a specified training step."""

    def __init__(self, rate: float, noise_shape=None, start_step: int = 0, **kwargs):
        super().__init__(**kwargs)
        self.supports_masking = True
        self.rate = rate
        self.start_step = start_step
        self.dropout = tf.keras.layers.Dropout(rate, noise_shape=noise_shape)

    def build(self, input_shape):
        super().build(input_shape)
        agg = tf.VariableAggregation.ONLY_FIRST_REPLICA
        self._train_counter = tf.Variable(0, dtype="int64", aggregation=agg, trainable=False)

    def call(self, inputs, training=False):
        x = tf.cond(
            self._train_counter < self.start_step,
            lambda: inputs,
            lambda: self.dropout(inputs, training=training),
        )
        if training:
            self._train_counter.assign_add(1)
        return x


class CausalDWConv1D(tf.keras.layers.Layer):
    """Causal Dilated Depthwise Convolutional 1D layer."""

    def __init__(
        self,
        kernel_size=17,
        dilation_rate=1,
        use_bias=False,
        depthwise_initializer="glorot_uniform",
        name=None,
        **kwargs,
    ):
        base_name = name or str(tf.keras.backend.get_uid("causaldw"))
        super().__init__(name=base_name, **kwargs)
        self.causal_pad = tf.keras.layers.ZeroPadding1D(
            (dilation_rate * (kernel_size - 1), 0), name=base_name + "_pad"
        )
        self.dw_conv = tf.keras.layers.DepthwiseConv1D(
            kernel_size,
            strides=1,
            dilation_rate=dilation_rate,
            padding="valid",
            use_bias=use_bias,
            depthwise_initializer=depthwise_initializer,
            name=base_name + "_dwconv",
        )
        self.supports_masking = True

    def call(self, inputs):
        x = self.causal_pad(inputs)
        x = self.dw_conv(x)
        return x


def Conv1DBlock(
    channel_size: int,
    kernel_size: int,
    dilation_rate: int = 1,
    drop_rate: float = 0.0,
    expand_ratio: int = 2,
    se_ratio: float = 0.25,
    activation: str = "swish",
    name: Optional[str] = None,
):
    """Efficient Conv1D block matching original training architecture."""
    if name is None:
        name = str(tf.keras.backend.get_uid("mbblock"))

    def apply(inputs):
        channels_in = tf.keras.backend.int_shape(inputs)[-1]
        channels_expand = channels_in * expand_ratio
        skip = inputs

        x = tf.keras.layers.Dense(
            channels_expand,
            use_bias=True,
            activation=activation,
            name=name + "_expand_conv",
        )(inputs)

        x = CausalDWConv1D(
            kernel_size,
            dilation_rate=dilation_rate,
            use_bias=False,
            name=name + "_dwconv",
        )(x)

        x = tf.keras.layers.BatchNormalization(momentum=0.95, name=name + "_bn")(x)
        x = ECA()(x)

        x = tf.keras.layers.Dense(
            channel_size,
            use_bias=True,
            name=name + "_project_conv",
        )(x)

        if drop_rate > 0:
            x = tf.keras.layers.Dropout(drop_rate, noise_shape=(None, 1, 1), name=name + "_drop")(x)

        if channels_in == channel_size:
            x = tf.keras.layers.add([x, skip], name=name + "_add")
        return x

    return apply


class MultiHeadSelfAttention(tf.keras.layers.Layer):
    """Multi-Head Self-Attention Layer."""

    def __init__(self, dim: int = 192, num_heads: int = 4, dropout: float = 0.2, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.scale = self.dim ** -0.5
        self.num_heads = num_heads
        self.qkv = tf.keras.layers.Dense(3 * dim, use_bias=False)
        self.drop1 = tf.keras.layers.Dropout(dropout)
        self.proj = tf.keras.layers.Dense(dim, use_bias=False)
        self.supports_masking = True

    def call(self, inputs, mask=None):
        qkv = self.qkv(inputs)
        qkv = tf.keras.layers.Permute((2, 1, 3))(
            tf.keras.layers.Reshape((-1, self.num_heads, self.dim * 3 // self.num_heads))(qkv)
        )
        q, k, v = tf.split(qkv, [self.dim // self.num_heads] * 3, axis=-1)

        attn = tf.matmul(q, k, transpose_b=True) * self.scale
        if mask is not None:
            mask = mask[:, None, None, :]

        attn = tf.keras.layers.Softmax(axis=-1)(attn, mask=mask)
        attn = self.drop1(attn)

        x = attn @ v
        x = tf.keras.layers.Reshape((-1, self.dim))(tf.keras.layers.Permute((2, 1, 3))(x))
        x = self.proj(x)
        return x


def TransformerBlock(
    dim: int = 192,
    num_heads: int = 4,
    expand: int = 2,
    attn_dropout: float = 0.2,
    drop_rate: float = 0.2,
    activation: str = "swish",
):
    """Transformer Attention Block."""

    def apply(inputs):
        x = inputs
        x = tf.keras.layers.BatchNormalization(momentum=0.95)(x)
        x = MultiHeadSelfAttention(dim=dim, num_heads=num_heads, dropout=attn_dropout)(x)
        x = tf.keras.layers.Dropout(drop_rate, noise_shape=(None, 1, 1))(x)
        x = tf.keras.layers.Add()([inputs, x])
        attn_out = x

        x = tf.keras.layers.BatchNormalization(momentum=0.95)(x)
        x = tf.keras.layers.Dense(dim * expand, use_bias=False, activation=activation)(x)
        x = tf.keras.layers.Dense(dim, use_bias=False)(x)
        x = tf.keras.layers.Dropout(drop_rate, noise_shape=(None, 1, 1))(x)
        return tf.keras.layers.Add()([attn_out, x])

    return apply


def build_backbone(max_len: int = MAX_LEN, dim: int = 192, dropout_step: int = 0) -> tf.keras.Model:
    """Builds the 1D-CNN + Transformer sequence classifier (~1.836M parameters)."""
    inp = tf.keras.Input((max_len, CHANNELS), name="temporal_features")
    x = inp
    ksize = 17

    # Stem layers
    x = tf.keras.layers.Dense(dim, use_bias=False, name="stem_conv")(x)
    x = tf.keras.layers.BatchNormalization(momentum=0.95, name="stem_bn")(x)

    # Convolutional and Transformer blocks (Stage 1)
    x = Conv1DBlock(dim, ksize, drop_rate=0.2)(x)
    x = Conv1DBlock(dim, ksize, drop_rate=0.2)(x)
    x = Conv1DBlock(dim, ksize, drop_rate=0.2)(x)
    x = TransformerBlock(dim, expand=2)(x)

    # Convolutional and Transformer blocks (Stage 2)
    x = Conv1DBlock(dim, ksize, drop_rate=0.2)(x)
    x = Conv1DBlock(dim, ksize, drop_rate=0.2)(x)
    x = Conv1DBlock(dim, ksize, drop_rate=0.2)(x)
    x = TransformerBlock(dim, expand=2)(x)

    # Classification Head
    x = tf.keras.layers.Dense(dim * 2, activation=None, name="top_conv")(x)
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    x = LateDropout(0.8, start_step=dropout_step)(x)
    x = tf.keras.layers.Dense(NUM_CLASSES, name="classifier", activation="softmax")(x)

    return tf.keras.Model(inp, x, name="islr_1dcnn_transformer")


class TFLiteModel(tf.Module):
    """End-to-end wrapper combining Preprocess layer and ISLR model."""

    def __init__(self, islr_models: List[tf.keras.Model]):
        super().__init__()
        self.prep_inputs = Preprocess()
        self.islr_models = islr_models

    @tf.function(input_signature=[tf.TensorSpec(shape=[None, 543, 3], dtype=tf.float32, name="inputs")])
    def __call__(self, inputs: tf.Tensor) -> Dict[str, tf.Tensor]:
        x = self.prep_inputs(tf.cast(inputs, dtype=tf.float32))
        outputs = [model(x) for model in self.islr_models]
        averaged = tf.keras.layers.Average()(outputs)[0]
        return {"outputs": averaged}


class ModelManager:
    """Singleton model lifecycle manager: loads once and keeps ready in memory."""

    _instance: Optional["ModelManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.status = "Loading"
        self.load_duration_sec: float = 0.0
        self.param_count: int = 0
        self.weights_path: Path = settings.model.weights_path
        self.base_model: Optional[tf.keras.Model] = None
        self.pipeline_model: Optional[TFLiteModel] = None
        self.error_message: Optional[str] = None
        self.load_model()
        self._initialized = True

    def load_model(self) -> bool:
        """Loads weights and warms up model pipeline."""
        start_time = time.time()
        try:
            print(f"[ModelManager] Instantiating 1D-CNN + Transformer architecture (dim={settings.model.dim})...")
            self.base_model = build_backbone(dim=settings.model.dim)
            self.param_count = self.base_model.count_params()

            if not self.weights_path.exists():
                raise FileNotFoundError(f"Model weights not found at: {self.weights_path}")

            print(f"[ModelManager] Loading weights from {self.weights_path}...")
            self.base_model.load_weights(str(self.weights_path))

            self.pipeline_model = TFLiteModel(islr_models=[self.base_model])

            # Warm-up compile with dummy sequence
            dummy = np.zeros((settings.inference.sequence_length, 543, 3), dtype=np.float32)
            _ = self.pipeline_model(dummy)

            self.load_duration_sec = round(time.time() - start_time, 3)
            self.status = "Ready"
            print(f"[ModelManager] Model Ready! Loaded in {self.load_duration_sec}s ({self.param_count:,} parameters).")
            return True
        except Exception as e:
            self.status = "Error"
            self.error_message = str(e)
            print(f"[ModelManager ERROR] Failed to load model: {e}")
            return False

    def predict(self, sequence: np.ndarray) -> np.ndarray:
        """Runs inference on a (Sequence_Length, 543, 3) array and returns 250-class probability vector."""
        if self.pipeline_model is None or self.status != "Ready":
            raise RuntimeError(f"Model is not ready for inference (status={self.status})")
        out = self.pipeline_model(sequence)
        return out["outputs"].numpy()

    def get_info(self) -> Dict[str, Any]:
        """Returns model metadata and diagnostics."""
        return {
            "status": self.status,
            "architecture": settings.model.architecture,
            "parameters": self.param_count,
            "num_classes": NUM_CLASSES,
            "input_channels": CHANNELS,
            "sequence_length": settings.inference.sequence_length,
            "load_time_sec": self.load_duration_sec,
            "weights_path": str(self.weights_path),
            "error": self.error_message,
        }


def get_model_manager() -> ModelManager:
    return ModelManager()
