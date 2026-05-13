"""
TensorFlow CNN Image Classification Training Script
Trains a CNN model on downloaded images and saves it as model.h5
"""

import os
import sys
import json
import numpy as np
from pathlib import Path
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Flatten, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import matplotlib.pyplot as plt
from typing import Tuple

# ===== IMPORT CONFIGURATION =====
try:
    from config import DATASET_CONFIG, MODEL_CONFIG
    print("✅ Configuration loaded from config.py")
except ImportError:
    print("❌ ERROR: config.py not found!")
    sys.exit(1)


class ImageClassificationModel:
    """Builds and trains a CNN model for image classification."""
    
    def __init__(self, config: dict):
        """Initialize model configuration."""
        self.config = config
        self.image_size = config["image_size"]
        self.batch_size = config["batch_size"]
        self.epochs = config["epochs"]
        self.validation_split = config.get("validation_split", 0.2)
        self.model = None
        self.history = None
        self.class_indices = None
        
        print(f"✅ Model Configuration Loaded")
        print(f"   Image Size: {self.image_size}")
        print(f"   Batch Size: {self.batch_size}")
        print(f"   Epochs: {self.epochs}\n")
    
    def validate_dataset(self, dataset_dir: str) -> Tuple[bool, int, list]:
        """
        Validate dataset structure and count classes.
        
        Args:
            dataset_dir: Path to dataset folder
        
        Returns:
            (is_valid: bool, num_classes: int, class_names: list)
        """
        try:
            print("🔍 Validating dataset structure...")
            
            dataset_path = Path(dataset_dir)
            
            if not dataset_path.exists():
                print(f"❌ Dataset folder not found: {dataset_dir}")
                return False, 0, []
            
            # Find subdirectories (classes)
            class_dirs = [d for d in dataset_path.iterdir() if d.is_dir()]
            
            if not class_dirs:
                print(f"⚠️  No class folders found in {dataset_dir}")
                print("   Expected structure: dataset/class1/, dataset/class2/, etc.")
                return False, 0, []
            
            # Count images in each class
            class_names = []
            total_images = 0
            
            for class_dir in sorted(class_dirs):
                image_files = [f for f in class_dir.iterdir() 
                              if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']]
                
                if image_files:
                    class_names.append(class_dir.name)
                    print(f"   📂 {class_dir.name}: {len(image_files)} images")
                    total_images += len(image_files)
            
            if not class_names:
                print("❌ No valid images found in dataset folders!")
                return False, 0, []
            
            print(f"\n✅ Dataset validated!")
            print(f"   Total Classes: {len(class_names)}")
            print(f"   Total Images: {total_images}\n")
            
            return True, len(class_names), class_names
            
        except Exception as e:
            print(f"❌ Error validating dataset: {e}")
            return False, 0, []
    
    def build_model(self, num_classes: int) -> Sequential:
        """
        Build CNN model architecture.
        
        Args:
            num_classes: Number of output classes
        
        Returns:
            Compiled Keras model
        """
        print("🏗️  Building CNN Model...")
        
        model = Sequential([
            # Block 1: Conv + Pool
            Conv2D(32, (3, 3), activation='relu', 
                   input_shape=(*self.image_size, 3), padding='same'),
            Conv2D(32, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            
            # Block 2: Conv + Pool
            Conv2D(64, (3, 3), activation='relu', padding='same'),
            Conv2D(64, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            
            # Block 3: Conv + Pool
            Conv2D(128, (3, 3), activation='relu', padding='same'),
            Conv2D(128, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            
            # Block 4: Conv + Pool
            Conv2D(256, (3, 3), activation='relu', padding='same'),
            Conv2D(256, (3, 3), activation='relu', padding='same'),
            MaxPooling2D((2, 2)),
            Dropout(0.25),
            
            # Fully Connected Layers
            Flatten(),
            Dense(512, activation='relu'),
            Dropout(0.5),
            Dense(256, activation='relu'),
            Dropout(0.5),
            Dense(num_classes, activation='softmax')  # Output layer
        ])
        
        # Compile model
        optimizer = Adam(learning_rate=self.config["learning_rate"])
        model.compile(
            optimizer=optimizer,
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print("\n✅ Model Architecture:")
        model.summary()
        print()
        
        self.model = model
        return model
    
    def create_data_generators(self, dataset_dir: str) -> Tuple:
        """
        Create ImageDataGenerator for training and validation.
        
        Args:
            dataset_dir: Path to dataset folder
        
        Returns:
            (train_generator, validation_generator)
        """
        print("📊 Creating Data Generators...\n")
        
        # Training data generator with augmentation
        train_datagen = ImageDataGenerator(
            rescale=1.0 / 255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2,
            shear_range=0.2,
            fill_mode='nearest',
            validation_split=self.validation_split,
        )
        
        # Validation data generator (no augmentation, only rescaling)
        validation_datagen = ImageDataGenerator(
            rescale=1.0 / 255,
            validation_split=self.validation_split,
        )
        
        # Load training data
        train_generator = train_datagen.flow_from_directory(
            dataset_dir,
            target_size=self.image_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='training',
            seed=42
        )

        validation_generator = validation_datagen.flow_from_directory(
            dataset_dir,
            target_size=self.image_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='validation',
            seed=42,
            shuffle=False,
        )

        self.class_indices = train_generator.class_indices
        
        print(f"✅ Data generators created")
        print(f"   Batch Size: {self.batch_size}\n")
        
        return train_generator, validation_generator
    
    def train(self, train_generator, validation_generator) -> dict:
        """
        Train the model with error handling.
        
        Args:
            train_generator: Training data generator
            validation_datagen: Validation data generator
            dataset_dir: Dataset folder path
        
        Returns:
            Training history dictionary
        """
        try:
            print("🚀 Starting Model Training...\n")
            
            # Calculate steps per epoch
            steps_per_epoch = max(1, train_generator.samples // self.batch_size)
            validation_steps = max(1, validation_generator.samples // self.batch_size)
            
            print(f"📈 Training Configuration:")
            print(f"   Training Samples: {train_generator.samples}")
            print(f"   Validation Samples: {validation_generator.samples}")
            print(f"   Steps per Epoch: {steps_per_epoch}")
            print(f"   Validation Steps: {validation_steps}\n")
            
            # Callbacks
            callbacks = [
                EarlyStopping(
                    monitor='val_loss',
                    patience=5,
                    restore_best_weights=True,
                    verbose=1
                ),
                ModelCheckpoint(
                    'best_model.h5',
                    monitor='val_accuracy',
                    save_best_only=True,
                    verbose=1
                )
            ]
            
            # Train the model
            history = self.model.fit(
                train_generator,
                steps_per_epoch=steps_per_epoch,
                epochs=self.epochs,
                validation_data=validation_generator,
                validation_steps=validation_steps,
                callbacks=callbacks,
                verbose=1
            )
            
            self.history = history
            return history
            
        except Exception as e:
            print(f"\n❌ Training failed: {e}")
            return None
    
    def save_class_names(self, model_save_path: str) -> bool:
        """Persist the exact class mapping used by the training generator."""
        try:
            if not self.class_indices:
                print("âš ï¸  No class indices available to export")
                return False

            output_path = Path(model_save_path).resolve().parent / "class_names.json"
            with open(output_path, "w", encoding="utf-8") as file_handle:
                json.dump(self.class_indices, file_handle, indent=2)

            print(f"âœ… Class mapping saved: {output_path}")
            return True

        except Exception as e:
            print(f"âŒ Error saving class mapping: {e}")
            return False

    def save_model(self, save_path: str) -> bool:
        """Save trained model to disk."""
        try:
            if self.model is None:
                print("❌ Model not trained yet!")
                return False
            
            self.model.save(save_path)
            print(f"\n✅ Model saved successfully: {os.path.abspath(save_path)}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving model: {e}")
            return False
    
    def plot_training_history(self) -> None:
        """Plot and save training accuracy and loss graphs."""
        if self.history is None:
            print("⚠️  No training history available")
            return
        
        try:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
            
            # Plot accuracy
            ax1.plot(self.history.history['accuracy'], label='Training Accuracy')
            ax1.plot(self.history.history['val_accuracy'], label='Validation Accuracy')
            ax1.set_xlabel('Epoch')
            ax1.set_ylabel('Accuracy')
            ax1.set_title('Model Accuracy')
            ax1.legend()
            ax1.grid(True)
            
            # Plot loss
            ax2.plot(self.history.history['loss'], label='Training Loss')
            ax2.plot(self.history.history['val_loss'], label='Validation Loss')
            ax2.set_xlabel('Epoch')
            ax2.set_ylabel('Loss')
            ax2.set_title('Model Loss')
            ax2.legend()
            ax2.grid(True)
            
            plt.tight_layout()
            plt.savefig('training_history.png', dpi=100)
            print("\n✅ Training history plot saved: training_history.png")
            plt.show()
            
        except Exception as e:
            print(f"\n⚠️  Could not plot training history: {e}")


def main():
    """Main execution function."""
    print("\n" + "="*60)
    print("🤖 TensorFlow CNN Image Classifier")
    print("="*60 + "\n")
    
    # Initialize model
    model_trainer = ImageClassificationModel(MODEL_CONFIG)
    
    # Validate dataset
    dataset_dir = DATASET_CONFIG["local_dataset_dir"]
    is_valid, num_classes, class_names = model_trainer.validate_dataset(dataset_dir)
    
    if not is_valid or num_classes < 2:
        print("❌ Cannot proceed without valid dataset!")
        print("💡 Please organize images into class folders first.")
        sys.exit(1)
    
    print(f"📌 Classes: {', '.join(class_names)}\n")
    
    # Build model
    model_trainer.build_model(num_classes)
    
    # Create data generators
    train_gen, val_gen = model_trainer.create_data_generators(dataset_dir)
    
    # Train model
    history = model_trainer.train(train_gen, val_gen)
    
    if history is None:
        print("\n❌ Training failed!")
        sys.exit(1)
    
    # Save model
    model_save_path = MODEL_CONFIG["model_save_path"]
    model_trainer.save_model(model_save_path)
    model_trainer.save_class_names(model_save_path)
    
    # Plot training history
    model_trainer.plot_training_history()
    
    print("\n" + "="*60)
    print("✅ Training Complete!")
    print("="*60)
    print(f"\n📊 Final Results:")
    print(f"   Training Accuracy:   {history.history['accuracy'][-1]:.4f}")
    print(f"   Validation Accuracy: {history.history['val_accuracy'][-1]:.4f}")
    print(f"   Training Loss:       {history.history['loss'][-1]:.4f}")
    print(f"   Validation Loss:     {history.history['val_loss'][-1]:.4f}\n")


if __name__ == "__main__":
    main()