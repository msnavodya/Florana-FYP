"""
Train the Florana plant disease model and export it for the FastAPI backend.

Expected dataset structure:
    ml_pipeline/dataset/
        Botrytis/
        Fresh Leaf/
        Leaf_Spot/
        Powdery_Mildew/
        Rust/

Each class folder should contain JPG, JPEG, PNG, BMP, or GIF images.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.layers import Conv2D, Dense, Dropout, Flatten, MaxPooling2D
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator

try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATASET_DIR = BASE_DIR / "dataset"
BACKEND_AI_DIR = PROJECT_ROOT / "backend" / "ai"
MODEL_PATH = BACKEND_AI_DIR / "plant_disease_model.keras"
CLASS_NAMES_PATH = BACKEND_AI_DIR / "class_names.json"
BEST_MODEL_PATH = BASE_DIR / "best_model.keras"
HISTORY_PATH = BASE_DIR / "training_history.png"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = int(os.getenv("FLORANA_BATCH_SIZE", "16"))
EPOCHS = int(os.getenv("FLORANA_EPOCHS", "15"))
VALIDATION_SPLIT = float(os.getenv("FLORANA_VALIDATION_SPLIT", "0.2"))
LEARNING_RATE = float(os.getenv("FLORANA_LEARNING_RATE", "0.001"))
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}


def validate_dataset() -> list[str]:
    if not DATASET_DIR.exists():
        raise SystemExit(
            f"Dataset folder not found: {DATASET_DIR}\n"
            "Create class folders under ml_pipeline/dataset before training."
        )

    class_names: list[str] = []
    total_images = 0

    print("Validating dataset...")
    for class_dir in sorted(path for path in DATASET_DIR.iterdir() if path.is_dir()):
        image_count = sum(1 for file_path in class_dir.iterdir() if file_path.suffix.lower() in SUPPORTED_EXTENSIONS)
        if image_count == 0:
            continue

        class_names.append(class_dir.name)
        total_images += image_count
        print(f"  {class_dir.name}: {image_count} images")

    if len(class_names) < 2:
        raise SystemExit("Training needs at least two class folders with images.")

    print(f"Dataset ready: {len(class_names)} classes, {total_images} images")
    return class_names


def build_model(num_classes: int) -> Sequential:
    model = Sequential(
        [
            Conv2D(32, (3, 3), activation="relu", input_shape=(*IMAGE_SIZE, 3), padding="same"),
            Conv2D(32, (3, 3), activation="relu", padding="same"),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            Conv2D(64, (3, 3), activation="relu", padding="same"),
            Conv2D(64, (3, 3), activation="relu", padding="same"),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            Conv2D(128, (3, 3), activation="relu", padding="same"),
            Conv2D(128, (3, 3), activation="relu", padding="same"),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            Conv2D(256, (3, 3), activation="relu", padding="same"),
            Conv2D(256, (3, 3), activation="relu", padding="same"),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            Flatten(),
            Dense(512, activation="relu"),
            Dropout(0.5),
            Dense(256, activation="relu"),
            Dropout(0.5),
            Dense(num_classes, activation="softmax"),
        ]
    )

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def save_history_plot(history: tf.keras.callbacks.History) -> None:
    if plt is None:
        print("matplotlib is not installed; skipping training history plot.")
        return

    fig, (accuracy_axis, loss_axis) = plt.subplots(1, 2, figsize=(12, 4))

    accuracy_axis.plot(history.history["accuracy"], label="Training Accuracy")
    accuracy_axis.plot(history.history["val_accuracy"], label="Validation Accuracy")
    accuracy_axis.set_title("Model Accuracy")
    accuracy_axis.set_xlabel("Epoch")
    accuracy_axis.set_ylabel("Accuracy")
    accuracy_axis.legend()
    accuracy_axis.grid(True)

    loss_axis.plot(history.history["loss"], label="Training Loss")
    loss_axis.plot(history.history["val_loss"], label="Validation Loss")
    loss_axis.set_title("Model Loss")
    loss_axis.set_xlabel("Epoch")
    loss_axis.set_ylabel("Loss")
    loss_axis.legend()
    loss_axis.grid(True)

    plt.tight_layout()
    plt.savefig(HISTORY_PATH, dpi=120)
    plt.close(fig)
    print(f"Training history saved: {HISTORY_PATH}")


def main() -> None:
    print("Florana disease model training")
    class_names = validate_dataset()

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        shear_range=0.2,
        fill_mode="nearest",
        validation_split=VALIDATION_SPLIT,
    )
    validation_datagen = ImageDataGenerator(rescale=1.0 / 255, validation_split=VALIDATION_SPLIT)

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        seed=42,
    )
    validation_generator = validation_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        seed=42,
        shuffle=False,
    )

    model = build_model(len(class_names))
    model.summary()

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True, verbose=1),
        ModelCheckpoint(BEST_MODEL_PATH, monitor="val_accuracy", save_best_only=True, verbose=1),
    ]

    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=validation_generator,
        callbacks=callbacks,
        verbose=1,
    )

    BACKEND_AI_DIR.mkdir(parents=True, exist_ok=True)
    model.save(MODEL_PATH)

    index_to_class = {index: name for name, index in train_generator.class_indices.items()}
    ordered_class_names = [index_to_class[index] for index in sorted(index_to_class)]
    with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as file_handle:
        json.dump(ordered_class_names, file_handle, indent=2)

    save_history_plot(history)

    print("Training complete.")
    print(f"Model saved: {MODEL_PATH}")
    print(f"Class names saved: {CLASS_NAMES_PATH}")
    print(f"Final training accuracy: {history.history['accuracy'][-1]:.4f}")
    print(f"Final validation accuracy: {history.history['val_accuracy'][-1]:.4f}")


if __name__ == "__main__":
    main()
