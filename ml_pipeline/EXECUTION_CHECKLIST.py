r"""
═══════════════════════════════════════════════════════════════════════════════
                    ML PIPELINE EXECUTION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Follow this checklist step-by-step to ensure successful execution.
Mark each step as completed (✓).

═══════════════════════════════════════════════════════════════════════════════
PHASE 1: ENVIRONMENT SETUP
═══════════════════════════════════════════════════════════════════════════════

☐ 1.1 Install Python 3.8+
      └─ Check: python --version
      └─ Should show: Python 3.8.x or higher

☐ 1.2 Navigate to ml_pipeline folder
      └─ Command: cd c:\Users\SADINI\Desktop\Florana\ml_pipeline

☐ 1.3 Create virtual environment
      └─ Command: python -m venv venv
      └─ Wait for folder to be created (~1 min)

☐ 1.4 Activate virtual environment
      └─ Command: .\venv\Scripts\Activate.ps1
      └─ Terminal should show: (venv) prefix

☐ 1.5 Install dependencies
      └─ Command: pip install -r requirements.txt
      └─ Wait 5-10 minutes for all packages
      └─ Last line should: "Successfully installed..."

☐ 1.6 Verify packages installed
      └─ Command: python verify_setup.py
      └─ All checks should show ✅

═══════════════════════════════════════════════════════════════════════════════
PHASE 2: CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════

☐ 2.1 Get Cloudinary credentials
      └─ Visit: https://cloudinary.com/console/settings/api-keys
      └─ Copy: cloud_name, api_key, api_secret

☐ 2.2 Create config.py from template
      └─ Command: Copy-Item config_template.py config.py
      └─ File should appear: config.py

☐ 2.3 Edit config.py with credentials
      └─ Open config.py in VS Code
      └─ Fill in CLOUDINARY_CONFIG:
         • cloud_name: "your_actual_cloud_name"
         • api_key: "your_actual_key"
         • api_secret: "your_actual_secret"

☐ 2.4 Edit config.py with folder path
      └─ Set folder_path to your Cloudinary folder
      └─ Examples: "florana/plants", "datasets/training"
      └─ Or leave empty "" for root folder

☐ 2.5 Edit config.py with dataset settings
      └─ local_dataset_dir: "./dataset" (usually fine)
      └─ image_size: (224, 224) (standard for CNN)
      └─ batch_size: 32 (adjust if out of memory)
      └─ epochs: 15 (increase for better accuracy)

☐ 2.6 ⚠️ Add config.py to .gitignore (IMPORTANT!)
      └─ It should already be in .gitignore
      └─ Verify: grep config.py .gitignore
      └─ Should return: config.py

═══════════════════════════════════════════════════════════════════════════════
PHASE 3: VERIFY SETUP
═══════════════════════════════════════════════════════════════════════════════

☐ 3.1 Run setup verification
      └─ Command: python verify_setup.py
      └─ Check outputs:
         ✅ Python version (3.8+)
         ✅ Virtual environment (active)
         ✅ All packages installed
         ✅ Cloudinary connection working
         ✅ Sufficient disk space (2GB+)

☐ 3.2 Confirm all checks pass
      └─ Message: "✅ VERIFICATION COMPLETE!"
      └─ If errors, fix them before proceeding

═══════════════════════════════════════════════════════════════════════════════
PHASE 4: DOWNLOAD IMAGES
═══════════════════════════════════════════════════════════════════════════════

☐ 4.1 Ensure virtual environment is active
      └─ Terminal should show: (venv) at start

☐ 4.2 Run download script
      └─ Command: python download_dataset.py
      └─ Wait 10-30 minutes depending on image count

☐ 4.3 Monitor download progress
      └─ Watch for:
         ✅ "Cloudinary configured successfully"
         ✅ "Found XXX images"
         ✅ "Downloading XXX images..."
         ✅ "✅ Successful: XXX"

☐ 4.4 Verify dataset folder created
      └─ Check: ls dataset/
      └─ Should show: class1/, class2/, class3/

☐ 4.5 Count downloaded images
      └─ Navigate to dataset/
      └─ Verify images are in named files (not duplicates)
      └─ Expected: 100-500+ images total

═══════════════════════════════════════════════════════════════════════════════
PHASE 5: ORGANIZE IMAGES (MANUAL - IMPORTANT!)
═══════════════════════════════════════════════════════════════════════════════

⚠️  THIS STEP IS CRITICAL FOR MODEL TRAINING!

☐ 5.1 Open dataset folder in Windows Explorer
      └─ Path: c:\Users\SADINI\Desktop\Florana\ml_pipeline\dataset

☐ 5.2 Understand folder structure
      └─ dataset/
         ├── class1/  ← Category A
         ├── class2/  ← Category B
         └── class3/  ← Category C

☐ 5.3 Organize images by category
      └─ For example, if classifying plants:
         • class1/ = Healthy plants (drag ~150 images)
         • class2/ = Diseased plants (drag ~145 images)
         • class3/ = Wilted plants (drag ~148 images)

☐ 5.4 Verify balanced distribution
      └─ Each class should have similar number of images
      └─ Minimum: 50 images per class
      └─ Ideal: 150+ images per class
      └─ Total: 300+ images

☐ 5.5 Check image quality
      └─ Remove corrupted/blur images
      └─ Verify images are readable
      └─ Check diverse variety in each class

☐ 5.6 Confirm all images organized
      └─ All files should be in subfolders
      └─ No images should be in dataset/ root
      └─ Run: ls dataset/class1/*.jpg | wc -l
      └─ Repeat for class2, class3

═══════════════════════════════════════════════════════════════════════════════
PHASE 6: TRAIN MODEL
═══════════════════════════════════════════════════════════════════════════════

☐ 6.1 Verify organized dataset
      └─ Command: python verify_setup.py
      └─ Should show image counts
      └─ Confirm all classes found

☐ 6.2 Start training process
      └─ Command: python train_model.py
      └─ Expected first output:
         ✅ Dataset validated
         🏗️ Building CNN Model...
         📊 Creating Data Generators...

☐ 6.3 Monitor training progress
      └─ Watch for each epoch:
         Epoch 1/15 [progress bar]
         Accuracy increases? ✅
         Loss decreases? ✅
         Validation keeps pace? ✅

☐ 6.4 Wait for training completion
      └─ Total time: 10-20 minutes (CPU)
      └─ Total time: 5-10 minutes (GPU)
      └─ Do not interrupt once started

☐ 6.5 Check final output
      └─ All three outputs created:
         ✅ model.h5 (3-15 MB file size)
         ✅ best_model.h5 (checkpoint)
         ✅ training_history.png (plot)

☐ 6.6 Review final metrics
      └─ Look for:
         Training Accuracy: 85%+ ✅
         Validation Accuracy: 80%+ ✅
         Training Loss: <0.5 ✅
         Validation Loss: <0.8 ✅

═══════════════════════════════════════════════════════════════════════════════
PHASE 7: VERIFY OUTPUTS
═══════════════════════════════════════════════════════════════════════════════

☐ 7.1 Check model files
      └─ Command: ls -lh *.h5
      └─ Should show:
         model.h5 (50-500 MB)
         best_model.h5 (50-500 MB)

☐ 7.2 View training plot
      └─ Open: training_history.png
      └─ Check:
         ✓ Accuracy curve goes up
         ✓ Loss curve goes down
         ✓ Training > Validation (expected)

☐ 7.3 Verify complete files created
      └─ ls ml_pipeline/
      └─ Should include:
         ✓ model.h5
         ✓ best_model.h5
         ✓ training_history.png
         ✓ dataset/ folder

═══════════════════════════════════════════════════════════════════════════════
PHASE 8: DEPLOYMENT & USAGE
═══════════════════════════════════════════════════════════════════════════════

☐ 8.1 Test model loading
      └─ Create test_model.py:
         from tensorflow.keras.models import load_model
         model = load_model('model.h5')
         print("✅ Model loaded successfully!")

☐ 8.2 Backup model file
      └─ Copy model.h5 to safe location
      └─ Create backup folder
      └─ Keep version history

☐ 8.3 Document results
      └─ Take screenshot of:
         ✓ training_history.png
         ✓ Final metrics output
         ✓ Folder structure

☐ 8.4 Integrate into application
      └─ Load model.h5 in your app
      └─ Preprocess images: resize to 224×224
      └─ Normalize: divide by 255
      └─ Get predictions

☐ 8.5 Monitor performance
      └─ Compare with expectations
      └─ Track accuracy in production
      └─ Collect feedback

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Problem: "config.py not found"
☐ Solution: Copy-Item config_template.py config.py
☐ Verify file exists: ls config.py

Problem: "Cloudinary API Error"
☐ Check credentials are correct in config.py
☐ Verify API key has permissions
☐ Test network connection
☐ Verify folder_path is correct

Problem: "No images found in dataset"
☐ Check download completed: ls dataset/
☐ Verify files are in subfolders: ls dataset/class*/
☐ Check file permissions: icacls dataset

Problem: "Out of Memory during training"
☐ Reduce batch_size in config.py (try 16 or 8)
☐ Reduce image_size (try 128×128)
☐ Close unnecessary applications
☐ Free up disk space

Problem: "Model not improving"
☐ Check image organization is balanced
☐ Add more training data
☐ Increase epochs in config.py
☐ Try different learning_rate

═══════════════════════════════════════════════════════════════════════════════
FINAL CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

☐ All files created and organized
☐ Virtual environment working
☐ All packages installed
☐ Configuration complete and secure
☐ Cloudinary connection verified
☐ Images downloaded successfully
☐ Images organized by class
☐ Training completed with good metrics
☐ Model files saved
☐ Training plots generated
☐ Ready for deployment

═══════════════════════════════════════════════════════════════════════════════

🎉 CONGRATULATIONS! You have successfully completed the ML pipeline!

Next Steps:
1. Review: SETUP_SUMMARY.md for quick reference
2. Deploy: Use model.h5 in your application
3. Iterate: Collect more data, retrain for better accuracy
4. Monitor: Track performance in production

Questions? Check:
→ README.md (detailed guide)
→ ARCHITECTURE.md (technical details)
→ QUICKSTART.py (command reference)

Happy machine learning! 🚀
═══════════════════════════════════════════════════════════════════════════════
"""

print(__doc__)