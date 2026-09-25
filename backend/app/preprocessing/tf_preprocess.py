"""
TensorFlow Preprocessing Pipeline for Google ISLR 1D-CNN + Transformer
Implements:
- 118-landmark selection (Lips, Hands, Nose, Eyes)
- Centering on landmark 17 (lower lip anchor)
- Scale standardization
- First-order temporal differences (velocity dx)
- Second-order temporal differences (acceleration dx2)
- Concatenation into (Batch, Time, 708) feature tensor
"""

import numpy as np
import tensorflow as tf

MAX_LEN = 384
NUM_CLASSES = 250
PAD = -100.0

NOSE = [1, 2, 98, 327]
LIP = [
    0, 61, 185, 40, 39, 37, 267, 269, 270, 409,
    291, 146, 91, 181, 84, 17, 314, 405, 321, 375,
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415,
    95, 88, 178, 87, 14, 317, 402, 318, 324, 308,
]
REYE = [
    33, 7, 163, 144, 145, 153, 154, 155, 133,
    246, 161, 160, 159, 158, 157, 173,
]
LEYE = [
    263, 249, 390, 373, 374, 380, 381, 382, 362,
    466, 388, 387, 386, 385, 384, 398,
]
LHAND = np.arange(468, 489).tolist()
RHAND = np.arange(522, 543).tolist()

POINT_LANDMARKS = LIP + LHAND + RHAND + NOSE + REYE + LEYE
NUM_NODES = len(POINT_LANDMARKS)  # 118 nodes
CHANNELS = 6 * NUM_NODES          # 708 features


def tf_nan_mean(x, axis=0, keepdims=False):
    """Computes mean of input tensor while ignoring NaN entries."""
    num = tf.reduce_sum(tf.where(tf.math.is_nan(x), tf.zeros_like(x), x), axis=axis, keepdims=keepdims)
    denom = tf.reduce_sum(tf.where(tf.math.is_nan(x), tf.zeros_like(x), tf.ones_like(x)), axis=axis, keepdims=keepdims)
    return num / tf.maximum(denom, 1e-6)


def tf_nan_std(x, center=None, axis=0, keepdims=False):
    """Computes standard deviation of input tensor while ignoring NaN entries."""
    if center is None:
        center = tf_nan_mean(x, axis=axis, keepdims=True)
    d = x - center
    return tf.math.sqrt(tf_nan_mean(d * d, axis=axis, keepdims=keepdims) + 1e-6)


class Preprocess(tf.keras.layers.Layer):
    """
    Preprocessing layer for raw MediaPipe landmark sequence.
    Input: [Batch, Sequence_Length, 543, 3] or [Sequence_Length, 543, 3]
    Output: [Batch, Sequence_Length, 708] preprocessed temporal features
    """

    def __init__(self, max_len=MAX_LEN, point_landmarks=POINT_LANDMARKS, **kwargs):
        super().__init__(**kwargs)
        self.max_len = max_len
        self.point_landmarks = point_landmarks

    def call(self, inputs):
        if tf.rank(inputs) == 3:
            x = inputs[None, ...]
        else:
            x = inputs

        # Centering using Lip landmark 17 (lower lip anchor)
        mean = tf_nan_mean(tf.gather(x, [17], axis=2), axis=[1, 2], keepdims=True)
        mean = tf.where(tf.math.is_nan(mean), tf.constant(0.5, x.dtype), mean)
        
        # Sub-select the 118 target nodes
        x = tf.gather(x, self.point_landmarks, axis=2)

        # Scale standard deviation
        std = tf_nan_std(x, center=mean, axis=[1, 2], keepdims=True)
        x = (x - mean) / tf.maximum(std, 1e-5)

        if self.max_len is not None:
            x = x[:, :self.max_len]
        length = tf.shape(x)[1]

        # Use X and Y coordinates (ignoring raw uncalibrated Z depth)
        x = x[..., :2]

        # First-order temporal difference (velocity)
        dx = tf.cond(
            tf.shape(x)[1] > 1,
            lambda: tf.pad(x[:, 1:] - x[:, :-1], [[0, 0], [0, 1], [0, 0], [0, 0]]),
            lambda: tf.zeros_like(x),
        )

        # Second-order temporal difference (acceleration)
        dx2 = tf.cond(
            tf.shape(x)[1] > 2,
            lambda: tf.pad(x[:, 2:] - x[:, :-2], [[0, 0], [0, 2], [0, 0], [0, 0]]),
            lambda: tf.zeros_like(x),
        )

        # Concatenate coords + velocity + acceleration
        x = tf.concat([
            tf.reshape(x, (-1, length, 2 * len(self.point_landmarks))),
            tf.reshape(dx, (-1, length, 2 * len(self.point_landmarks))),
            tf.reshape(dx2, (-1, length, 2 * len(self.point_landmarks))),
        ], axis=-1)

        x = tf.where(tf.math.is_nan(x), tf.constant(0.0, x.dtype), x)
        return x
