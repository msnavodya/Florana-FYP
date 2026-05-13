"""
Cloudinary Image Download Script
Fetches all images from a Cloudinary folder and downloads them locally.
Handles pagination for folders with 500+ images.
"""

import os
import sys
import cloudinary
import cloudinary.api
import cloudinary.uploader
import requests
from pathlib import Path
from typing import List, Dict, Tuple
import time

# ===== IMPORT CONFIGURATION =====
try:
    from config import CLOUDINARY_CONFIG, DATASET_CONFIG, SUPPORTED_FORMATS
    print("✅ Configuration loaded from config.py")
except ImportError:
    print("❌ ERROR: config.py not found!")
    print("📝 Please rename config_template.py to config.py and fill in your Cloudinary credentials.")
    sys.exit(1)


class CloudinaryDownloader:
    """Handles downloading images from Cloudinary with error handling and pagination."""
    
    def __init__(self, config: Dict):
        """Initialize Cloudinary with API credentials."""
        self.config = config
        self.downloaded_count = 0
        self.failed_count = 0
        self.skipped_count = 0
        
        # Configure Cloudinary
        try:
            cloudinary.config(
                cloud_name=config["cloud_name"],
                api_key=config["api_key"],
                api_secret=config["api_secret"]
            )
            print("✅ Cloudinary configured successfully\n")
        except Exception as e:
            print(f"❌ Failed to configure Cloudinary: {e}")
            sys.exit(1)
    
    def create_dataset_folder(self, path: str) -> bool:
        """Create local dataset folder if it doesn't exist."""
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            print(f"✅ Dataset folder ready: {os.path.abspath(path)}\n")
            return True
        except Exception as e:
            print(f"❌ Failed to create dataset folder: {e}")
            return False
    
    def get_file_extension(self, resource_type: str, format_type: str) -> str:
        """Determine file extension based on resource type and format."""
        format_type = format_type.lower()
        
        # Map API formats to file extensions
        format_mapping = {
            "jpg": ".jpg",
            "jpeg": ".jpg",
            "png": ".png",
            "gif": ".gif",
            "bmp": ".bmp",
            "webp": ".webp"
        }
        
        return format_mapping.get(format_type, ".jpg")  # Default to .jpg
    
    def fetch_images_from_cloudinary(self, folder_path: str = "", max_results: int = 500) -> List[Dict]:
        """
        Fetch all images from Cloudinary folder with pagination support.
        
        Args:
            folder_path: Cloudinary folder path (e.g., "florana/plants")
            max_results: Maximum results per API call (Cloudinary default: 500)
        
        Returns:
            List of image resource objects
        """
        all_resources = []
        next_cursor = None
        page_count = 0
        
        try:
            print(f"🔍 Searching for images in Cloudinary folder: '{folder_path or 'root'}'...")
            
            while True:
                page_count += 1
                print(f"   📄 Fetching page {page_count}...")
                
                # Build API parameters
                params = {
                    "type": "upload",
                    "resource_type": "image",
                    "max_results": max_results
                }
                
                # Add folder filter if specified
                if folder_path:
                    params["prefix"] = folder_path
                
                # Add pagination cursor if available
                if next_cursor:
                    params["next_cursor"] = next_cursor
                
                # Fetch resources
                response = cloudinary.api.resources(**params)
                
                if not response.get("resources"):
                    print("   ⚠️  No resources found on this page")
                    break
                
                # Filter by image formats
                images = [
                    r for r in response.get("resources", [])
                    if f".{r.get('format', '')}" in SUPPORTED_FORMATS
                ]
                
                all_resources.extend(images)
                print(f"   ✅ Found {len(images)} images on page {page_count}")
                
                # Check for more pages
                next_cursor = response.get("next_cursor")
                if not next_cursor:
                    break
                
                # Small delay to avoid rate limiting
                time.sleep(0.5)
            
            print(f"\n✅ Total images found: {len(all_resources)}\n")
            return all_resources
            
        except cloudinary.exceptions.Error as e:
            print(f"\n❌ Cloudinary API Error: {e}")
            print("   💡 Check your credentials and folder path")
            return []
        except Exception as e:
            print(f"\n❌ Error fetching images: {e}")
            return []
    
    def download_image(self, resource: Dict, save_dir: str) -> Tuple[bool, str]:
        """
        Download a single image from Cloudinary.
        
        Args:
            resource: Resource object from Cloudinary API
            save_dir: Local directory to save image
        
        Returns:
            (success: bool, message: str)
        """
        try:
            # Generate filename
            public_id = resource.get("public_id", "image")
            format_ext = self.get_file_extension(
                resource.get("resource_type", "image"),
                resource.get("format", "jpg")
            )
            
            # Extract just the filename (remove folder path)
            filename = Path(public_id).name + format_ext
            filepath = os.path.join(save_dir, filename)
            
            # Skip if already exists
            if os.path.exists(filepath):
                self.skipped_count += 1
                return True, f"⏭️  Skipped (already exists)"
            
            # Get secure download URL
            secure_url = resource.get("secure_url")
            if not secure_url:
                return False, "❌ No download URL found"
            
            # Download image
            response = requests.get(secure_url, timeout=10)
            if response.status_code != 200:
                return False, f"❌ HTTP {response.status_code}"
            
            # Save to disk
            with open(filepath, "wb") as f:
                f.write(response.content)
            
            self.downloaded_count += 1
            return True, f"✅ Downloaded"
            
        except requests.exceptions.RequestException as e:
            self.failed_count += 1
            return False, f"❌ Download failed: {str(e)[:30]}"
        except IOError as e:
            self.failed_count += 1
            return False, f"❌ File write failed: {str(e)[:30]}"
        except Exception as e:
            self.failed_count += 1
            return False, f"❌ Error: {str(e)[:30]}"
    
    def download_all_images(self, images: List[Dict], save_dir: str) -> None:
        """Download all images from the list."""
        if not images:
            print("⚠️  No images to download!")
            return
        
        print(f"📥 Downloading {len(images)} images...\n")
        
        for idx, resource in enumerate(images, 1):
            public_id = resource.get("public_id", "image")
            success, message = self.download_image(resource, save_dir)
            
            # Print progress
            status = "✅" if success else "❌"
            print(f"[{idx}/{len(images)}] {public_id}")
            print(f"        {message}")
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"📊 Download Summary:")
        print(f"   ✅ Successful: {self.downloaded_count}")
        print(f"   ⏭️  Skipped:     {self.skipped_count}")
        print(f"   ❌ Failed:      {self.failed_count}")
        print(f"{'='*60}\n")


def organize_dataset_structure(dataset_dir: str) -> None:
    """Create placeholder folder structure for classification."""
    try:
        print("📁 Creating dataset structure...")
        
        # Create placeholder folders for classification
        class_folders = ["class1", "class2", "class3"]
        
        for folder in class_folders:
            class_path = os.path.join(dataset_dir, folder)
            Path(class_path).mkdir(parents=True, exist_ok=True)
        
        print("✅ Placeholder folders created:")
        print("   📂 class1/")
        print("   📂 class2/")
        print("   📂 class3/")
        print("\n💡 TIP: Organize downloaded images into these folders based on their category.\n")
        
    except Exception as e:
        print(f"⚠️  Could not create folder structure: {e}\n")


def main():
    """Main execution function."""
    print("\n" + "="*60)
    print("🌤️  Cloudinary Image Downloader")
    print("="*60 + "\n")
    
    # Initialize downloader
    downloader = CloudinaryDownloader(CLOUDINARY_CONFIG)
    
    # Create dataset folder
    dataset_dir = DATASET_CONFIG["local_dataset_dir"]
    if not downloader.create_dataset_folder(dataset_dir):
        sys.exit(1)
    
    # Fetch images from Cloudinary
    folder_path = DATASET_CONFIG["folder_path"]
    images = downloader.fetch_images_from_cloudinary(folder_path=folder_path)
    
    if not images:
        print("⚠️  No images found. Exiting.\n")
        sys.exit(1)
    
    # Download all images
    downloader.download_all_images(images, dataset_dir)
    
    # Create folder structure for classification
    organize_dataset_structure(dataset_dir)
    
    print("✅ Dataset download complete!")
    print(f"📂 Images saved to: {os.path.abspath(dataset_dir)}\n")


if __name__ == "__main__":
    main()