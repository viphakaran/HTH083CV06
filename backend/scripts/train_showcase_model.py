import os
import json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.interpolate import interp1d

torch.manual_seed(42)
np.random.seed(42)

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "data" / "train_ready_dataset.npz"
LABEL_MAPPING_PATH = BASE_DIR / "data" / "label_mapping.json"
MODEL_DIR = BASE_DIR / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SAVE_PATH = MODEL_DIR / "lstm_showcase.pth"
LABEL_SAVE_PATH = MODEL_DIR / "label_mapping_showcase.json"
CONF_MATRIX_PATH = MODEL_DIR / "confusion_matrix_showcase.png"
EVAL_REPORT_PATH = MODEL_DIR / "evaluation_report_showcase.json"

# 1. Load full dataset & filter to the 8 core showcase words
SHOWCASE_WORDS = ["wait", "doctor", "thank you", "more", "sick", "please", "here", "now"]

with open(LABEL_MAPPING_PATH, "r", encoding="utf-8") as f:
    full_label_map = json.load(f)

raw_data = np.load(DATASET_PATH)
X_all = raw_data["X"]  # (135, 60, 254)
y_all = raw_data["y"]

# Identify indices of showcase words
orig_indices = [int(k) for k, v in full_label_map.items() if v in SHOWCASE_WORDS]
mask = np.isin(y_all, orig_indices)

X_filtered = X_all[mask]
y_raw = y_all[mask]

word_to_new_idx = {w: i for i, w in enumerate(SHOWCASE_WORDS)}
new_idx_to_word = {str(i): w for i, w in enumerate(SHOWCASE_WORDS)}
y_filtered = np.array([word_to_new_idx[full_label_map[str(idx)]] for idx in y_raw], dtype=np.int64)

num_classes = len(SHOWCASE_WORDS)
print(f"Showcase dataset filtered: {len(y_filtered)} samples across {num_classes} classes.")
for w in SHOWCASE_WORDS:
    print(f"  {w}: {np.sum(y_filtered == word_to_new_idx[w])} samples")

# Save showcase label mapping
with open(LABEL_SAVE_PATH, "w", encoding="utf-8") as f:
    json.dump(new_idx_to_word, f, indent=2)

# 2. Stratified train/val split (80/20) on real samples
X_train_base, X_val, y_train_base, y_val = train_test_split(
    X_filtered, y_filtered, test_size=0.25, stratify=y_filtered, random_state=42
)
print(f"\nBase Train samples: {len(y_train_base)}, Val samples (clean): {len(y_val)}")

# 3. Landmark Augmentation ONLY on Training Set
def augment_sequence(seq, aug_type, rng):
    T, D = seq.shape
    new_seq = seq.copy()
    
    if aug_type == "speed_fast":
        # 15% faster (fewer frames)
        new_T = max(10, int(T * 0.85))
        f = interp1d(np.linspace(0, 1, T), new_seq, axis=0, kind='linear')
        new_seq = f(np.linspace(0, 1, new_T)).astype(np.float32)
        pad = np.zeros((T, D), dtype=np.float32)
        pad[:new_T] = new_seq
        new_seq = pad
        
    elif aug_type == "speed_slow":
        # 15% slower (more frames, truncated to 60)
        new_T = min(75, int(T * 1.15))
        f = interp1d(np.linspace(0, 1, T), new_seq, axis=0, kind='linear')
        scaled = f(np.linspace(0, 1, new_T)).astype(np.float32)
        new_seq = scaled[:60]
        
    elif aug_type == "jitter":
        # Gaussian jitter on coordinates
        noise = rng.normal(0, 0.007, size=(T, 126)).astype(np.float32)
        new_seq[:, :126] += noise
        
    elif aug_type == "scale_rotate":
        scale = rng.uniform(0.95, 1.05)
        angle = np.radians(rng.uniform(-4.0, 4.0))
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        for h in [0, 1]:
            offset = h * 63
            for lm in range(21):
                idx = offset + lm * 3
                x = new_seq[:, idx] * scale
                y = new_seq[:, idx + 1] * scale
                new_seq[:, idx] = x * cos_a - y * sin_a
                new_seq[:, idx + 1] = x * sin_a + y * cos_a
                
    # Recompute velocity
    new_seq[0, 128:254] = 0.0
    if T > 1:
        new_seq[1:, 128:254] = new_seq[1:, :126] - new_seq[:-1, :126]
        
    return new_seq

rng = np.random.RandomState(42)
X_train_list = list(X_train_base)
y_train_list = list(y_train_base)

# Generate 4 augmented copies per training sample
aug_types = ["speed_fast", "speed_slow", "jitter", "scale_rotate"]
for sample_idx in range(len(X_train_base)):
    orig_x = X_train_base[sample_idx]
    orig_y = y_train_base[sample_idx]
    for aug_type in aug_types:
        aug_x = augment_sequence(orig_x, aug_type, rng)
        X_train_list.append(aug_x)
        y_train_list.append(orig_y)

X_train = np.array(X_train_list, dtype=np.float32)
y_train = np.array(y_train_list, dtype=np.int64)

print(f"Augmented Train samples: {len(y_train)} (5x expansion)")

# 4. PyTorch Dataset & DataLoader
class SignDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.long)
    def __len__(self):
        return len(self.y)
    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

train_loader = DataLoader(SignDataset(X_train, y_train), batch_size=16, shuffle=True)
val_loader = DataLoader(SignDataset(X_val, y_val), batch_size=16, shuffle=False)

# 5. LSTM Architecture
class SignLSTM(nn.Module):
    def __init__(self, input_size=254, hidden_size=64, num_layers=1, num_classes=8, dropout=0.3):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_size, num_classes)
        
    def forward(self, x):
        _, (hn, _) = self.lstm(x)
        out = self.dropout(hn[-1])
        return self.fc(out)

model = SignLSTM(input_size=254, hidden_size=64, num_layers=1, num_classes=num_classes, dropout=0.3)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.002, weight_decay=1e-4)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

# 6. Training loop with early stopping
epochs = 80
best_val_loss = float("inf")
best_model_state = None
best_epoch = 0
patience = 20
patience_count = 0

for epoch in range(1, epochs + 1):
    model.train()
    train_loss, correct, total = 0.0, 0, 0
    for bx, by in train_loader:
        optimizer.zero_grad()
        out = model(bx)
        loss = criterion(out, by)
        loss.backward()
        optimizer.step()
        train_loss += loss.item() * bx.size(0)
        preds = out.argmax(dim=1)
        correct += (preds == by).sum().item()
        total += by.size(0)
        
    t_loss = train_loss / total
    t_acc = correct / total
    
    model.eval()
    val_loss, v_correct, v_total = 0.0, 0, 0
    with torch.no_grad():
        for bx, by in val_loader:
            out = model(bx)
            loss = criterion(out, by)
            val_loss += loss.item() * bx.size(0)
            preds = out.argmax(dim=1)
            v_correct += (preds == by).sum().item()
            v_total += by.size(0)
            
    v_loss = val_loss / v_total
    v_acc = v_correct / v_total
    scheduler.step(v_loss)
    
    if v_loss < best_val_loss:
        best_val_loss = v_loss
        best_epoch = epoch
        best_model_state = model.state_dict().copy()
        patience_count = 0
    else:
        patience_count += 1
        
    if epoch % 10 == 0 or epoch == 1 or v_loss == best_val_loss:
        print(f"Epoch {epoch:2d}/{epochs} | Train Loss: {t_loss:.4f} Acc: {t_acc*100:.1f}% | Val Loss: {v_loss:.4f} Acc: {v_acc*100:.1f}%")
        
    if patience_count >= patience:
        print(f"Early stopping at epoch {epoch}. Best epoch {best_epoch} with val loss {best_val_loss:.4f}")
        break

# 7. Evaluate Best Model
if best_model_state is not None:
    model.load_state_dict(best_model_state)

model.eval()
all_preds = []
all_targets = []
with torch.no_grad():
    for bx, by in val_loader:
        out = model(bx)
        preds = out.argmax(dim=1)
        all_preds.extend(preds.numpy())
        all_targets.extend(by.numpy())

all_preds = np.array(all_preds)
all_targets = np.array(all_targets)
final_val_acc = (all_preds == all_targets).mean()

print(f"\n==========================================")
print(f"SHOWCASE MODEL FINAL VALIDATION ACCURACY: {final_val_acc * 100:.2f}%")
print(f"==========================================")

report = classification_report(
    all_targets, all_preds,
    labels=list(range(num_classes)),
    target_names=SHOWCASE_WORDS,
    digits=3,
    output_dict=True,
    zero_division=0
)

# Save Checkpoint
torch.save({
    "epoch": best_epoch,
    "model_state_dict": model.state_dict(),
    "input_size": 254,
    "hidden_size": 64,
    "num_classes": num_classes,
    "label_mapping": new_idx_to_word,
    "class_names": SHOWCASE_WORDS,
    "best_val_loss": float(best_val_loss),
    "val_accuracy": float(final_val_acc)
}, str(MODEL_SAVE_PATH))

print(f"Saved showcase model checkpoint to {MODEL_SAVE_PATH}")

# Save Confusion Matrix
cm = confusion_matrix(all_targets, all_preds, labels=list(range(num_classes)))
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=SHOWCASE_WORDS, yticklabels=SHOWCASE_WORDS)
plt.title(f"Showcase 8-Class Confusion Matrix (Val Acc: {final_val_acc*100:.1f}%)", fontsize=13)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.xticks(rotation=45, ha="right")
plt.tight_layout()
plt.savefig(str(CONF_MATRIX_PATH), dpi=150)
plt.close()

# Save JSON Report
with open(EVAL_REPORT_PATH, "w", encoding="utf-8") as f:
    json.dump({
        "showcase_words": SHOWCASE_WORDS,
        "val_accuracy": float(final_val_acc),
        "best_epoch": best_epoch,
        "best_val_loss": float(best_val_loss),
        "classification_report": report
    }, f, indent=2)

print(f"Saved evaluation report to {EVAL_REPORT_PATH}")
