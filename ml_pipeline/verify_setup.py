"""
Setup Verification Script
Run this before downloading images to verify everything is configured correctly.
"""

import sys
import os
from pathlib import Path

print("\n" + "="*60)
print("🔍 ML Pipeline Setup Verification")
print("="*60 + "\n")

# Check 1: Python Version
print("✓ Check 1: Python Version")
python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
required_version = (3, 8)
if sys.version_info >= required_version:
    print(f"   ✅ Python {python_version} OK (Required: 3.8+)\n")
else:
    print(f"   ❌ Python {python_version} (Required: 3.8+)")
    print("   Install Python 3.8 or higher\n")
    sys.exit(1)

# Check 2: Virtual Environment
print("✓ Check 2: Virtual Environment")
if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
    print(f"   ✅ Virtual environment active\n")
else:
    print("   ⚠️  Virtual environment not detected")
    print("   💡 Tip: Activate with: .\\venv\\Scripts\\Activate.ps1\n")

# Check 3: Required Packages
print("✓ Check 3: Required Packages")
required_packages = {
    'cloudinary': 'Cloudinary API',
    'tensorflow': 'TensorFlow',
    'numpy': 'NumPy',
    'cv2': 'OpenCV',
    'PIL': 'Pillow',
    'matplotlib': 'Matplotlib',
    'requests': 'Requests'
}

all_packages_ok = True
for package, name in required_packages.items():
    try:
        __import__(package)
        print(f"   ✅ {name:20} installed")
    except ImportError:
        print(f"   ❌ {name:20} NOT installed")
        all_packages_ok = False

if not all_packages_ok:
    print("\n   🔧 Install missing packages:")
    print("   pip install -r requirements.txt\n")
else:
    print()

# Check 4: Configuration File
print("✓ Check 4: Configuration File")
if os.path.exists('config.py'):
    print("   ✅ config.py found")
    
    # Try to load config
    try:
        from config import CLOUDINARY_CONFIG, DATASET_CONFIG
        
        # Check credentials
        if CLOUDINARY_CONFIG.get('cloud_name') == 'your_cloud_name_here':
            print("   ❌ Cloudinary credentials not configured")
            print("   💡 Edit config.py and fill in your credentials\n")
            sys.exit(1)
        
        print("   ✅ Cloudinary config found")
        print("   ✅ Dataset config found\n")
        
    except Exception as e:
        print(f"   ❌ Error loading config.py: {e}\n")
        sys.exit(1)
else:
    print("   ❌ config.py not found")
    print("   💡 Copy config_template.py to config.py:")
    print("   Copy-Item config_template.py config.py\n")
    sys.exit(1)

# Check 5: Cloudinary Connection
print("✓ Check 5: Cloudinary Connection")
try:
    import cloudinary
    cloudinary.config(
        cloud_name=CLOUDINARY_CONFIG["cloud_name"],
        api_key=CLOUDINARY_CONFIG["api_key"],
        api_secret=CLOUDINARY_CONFIG["api_secret"]
    )
    
    # test the connection
    result = cloudinary.api.ping()
    if result.get('status') == 'ok':
        print("   ✅ Successfully connected to Cloudinary\n")
    else:
        print("   ❌ Cloudinary connection failed")
        print(f"   Response: {result}\n")
        sys.exit(1)
except Exception as e:
    print(f"   ❌ Cloudinary error: {e}")
    print("   💡 Check credentials in config.py\n")
    sys.exit(1)

# Check 6: Dataset Folder
print("✓ Check 6: Dataset Folder")
dataset_path = DATASET_CONFIG.get("local_dataset_dir", "./dataset")
if os.path.exists(dataset_path):
    image_count = sum(1 for root, dirs, files in os.walk(dataset_path) 
                     for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp')))
    print(f"   ✅ Dataset folder exists: {os.path.abspath(dataset_path)}")
    print(f"   📊 Current images: {image_count}\n")
else:
    print(f"   ℹ️  Dataset folder will be created: {os.path.abspath(dataset_path)}\n")

# Check 7: Disk Space
print("✓ Check 7: Disk Space")
try:
    import shutil
    stats = shutil.disk_usage(os.path.abspath('.'))
    free_gb = stats.free / (1024**3)
    
    if free_gb > 2:
        print(f"   ✅ Sufficient disk space: {free_gb:.1f} GB free\n")
    else:
        print(f"   ⚠️  Low disk space: {free_gb:.1f} GB free")
        print("   💡 Need at least 2GB for dataset\n")
except Exception as e:
    print(f"   ⚠️  Could not check disk space: {e}\n")

# Summary
print("="*60)
print("✅ VERIFICATION COMPLETE!")
print("="*60)
print("\nYou're ready to proceed! Run:")
print("   python download_dataset.py")
print("\nFor detailed instructions, see:")
print("   README.md\n")