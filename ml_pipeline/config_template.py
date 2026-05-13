# Provide the template Cloudinary configuration for the ML pipeline.
"""
Configuration template for Cloudinary credentials.
IMPORTANT: Rename this file to config.py and fill in your actual credentials.
Do NOT commit this file to version control!
"""

# Cloudinary API Credentials
CLOUDINARY_CONFIG = {
    "cloud_name": "your_cloud_name_here",
    "api_key": "your_api_key_here",
    "api_secret": "your_api_secret_here"
}

# Dataset Configuration
DATASET_CONFIG = {
    "folder_path": "your_cloudinary_folder_path",  # e.g., "florana/plants" or leave empty for root
    "local_dataset_dir": "./dataset",
    "training_split": 0.8,  # 80% training, 20% validation
    "image_size": (224, 224),
    "batch_size": 32
}

# Model Configuration
MODEL_CONFIG = {
    "epochs": 15,
    "learning_rate": 0.001,
    "validation_split": 0.2,
    "model_save_path": "./model.h5",
    "log_dir": "./logs"
}

# Supported image extensions
SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]
