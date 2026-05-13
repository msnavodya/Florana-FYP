r"""
QUICK START GUIDE
Copy and paste these commands in order to get started in minutes!

STEP 1: SETUP VIRTUAL ENVIRONMENT (Windows PowerShell)
====================================================================

cd c:\Users\SADINI\Desktop\Florana\ml_pipeline
python -m venv venv
.\venv\Scripts\Activate.ps1

macOS/Linux alternative:
python3 -m venv venv
source venv/bin/activate


STEP 2: INSTALL DEPENDENCIES
====================================================================

pip install -r requirements.txt
(This takes 5-10 minutes. Grab a coffee!)


STEP 3: CONFIGURE CREDENTIALS
====================================================================

Copy template to config file (Windows):
Copy-Item config_template.py config.py

macOS/Linux alternative:
cp config_template.py config.py

Now open config.py in VS Code and fill in:
- CLOUDINARY_CONFIG: cloud_name, api_key, api_secret
- DATASET_CONFIG: folder_path (your Cloudinary folder)


STEP 4: DOWNLOAD IMAGES FROM CLOUDINARY
====================================================================

python download_dataset.py

Expected output:
✅ Cloudinary configured successfully
🔍 Searching for images in Cloudinary folder...
✅ Total images found: XXX
📥 Downloading XXX images...
✅ Download Summary
✅ Dataset download complete!


STEP 5: ORGANIZE IMAGES (MANUAL)
====================================================================

After download, organize images in dataset/ folder:
dataset/
  ├── class1/  (move ~100-150 images here)
  ├── class2/  (move ~100-150 images here)
  └── class3/  (move ~100-150 images here)

Use Windows Explorer to drag and drop images into folders


STEP 6: TRAIN THE MODEL
====================================================================

python train_model.py

Expected output:
✅ Dataset validated!
🏗️  Building CNN Model...
📊 Creating Data Generators...
🚀 Starting Model Training...
Epoch 1/15 ... Epoch 15/15
✅ Model saved successfully: model.h5
✅ Training history plot saved: training_history.png
📊 Final Results:
   Training Accuracy: 0.XXXX
   Validation Accuracy: 0.XXXX


FINAL OUTPUTS
====================================================================

After training, check for:
✅ model.h5              - Your trained model (ready for production)
✅ best_model.h5        - Best checkpoint during training
✅ training_history.png - Accuracy/loss plots
✅ dataset/             - Your organized images


TROUBLESHOOTING
====================================================================

Problem: "config.py not found!"
Solution: Run this command to copy template
Copy-Item config_template.py config.py

Problem: "Cloudinary API Error"
Solution: Check your credentials in config.py

Problem: "No images found in dataset"
Solution: Make sure images are organized in class1/, class2/, class3/ folders

Problem: "Out of Memory during training"
Solution: Reduce batch_size in config.py (try 16 or 8 instead of 32)


NEXT STEPS
====================================================================

1. Review README.md for detailed documentation
2. Check training_history.png to see model performance
3. Use model.h5 in your application
4. Iterate: Add more images for better accuracy


USING YOUR TRAINED MODEL
====================================================================

Load and use the model in your Python code:
from tensorflow.keras.models import load_model
model = load_model('model.h5')
predictions = model.predict(image)
class_index = np.argmax(predictions[0])
"""

if __name__ == "__main__":
    print("""
================================================================================
SETUP COMPLETE!

Your ML pipeline is ready. Follow these steps:

1. Configure: Edit config.py with Cloudinary credentials
2. Download: python download_dataset.py
3. Organize: Move images to dataset/class1/, class2/, class3/
4. Train:    python train_model.py
5. Deploy:   Use model.h5 in your application

For details, see README.md

Good luck!
================================================================================
""")