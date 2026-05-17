# Florana ML Pipeline

The `ml_pipeline/` folder contains the dataset download and TensorFlow training workflow for Florana disease detection.

## What This Module Does

- downloads training images from Cloudinary if you choose to use that path
- trains a CNN image classifier on the local dataset
- exports model artifacts used by the FastAPI backend

## Important Files

| File | Purpose |
| --- | --- |
| `train.py` | Recommended training script for the current backend |
| `train_model.py` | Alternate legacy/manual training workflow |
| `download_dataset.py` | Optional Cloudinary dataset downloader |
| `config_template.py` | Template for Cloudinary config used by `download_dataset.py` and `train_model.py` |
| `requirements.txt` | ML-specific Python dependencies |

## Recommended Environment

Use a separate virtual environment inside `ml_pipeline/` because the ML dependencies differ from the backend runtime.

```powershell
cd ml_pipeline
python -m venv .venv-ml
.\.venv-ml\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Option A: Train With A Local Dataset

This is the simplest path if you already have images.

### 1. Create the dataset folder

Expected structure:

```text
ml_pipeline/dataset/
  Botrytis/
  Fresh Leaf/
  Leaf_Spot/
  Powdery_Mildew/
  Rust/
```

Each class folder should contain image files such as `.jpg`, `.jpeg`, `.png`, `.bmp`, or `.gif`.

### 2. Run training

```powershell
python train.py
```

### 3. Output files

`train.py` writes these files:

- `backend/ai/plant_disease_model.keras`
- `backend/ai/class_names.json`
- `ml_pipeline/best_model.keras`
- `ml_pipeline/training_history.png`

That means after `train.py` finishes, the backend is already pointing at the refreshed model artifact.

## Option B: Download Dataset From Cloudinary First

Use this only if your source images live in Cloudinary.

### 1. Create local config

```powershell
Copy-Item config_template.py config.py
```

Then edit `config.py` and add your real credentials:

```python
CLOUDINARY_CONFIG = {
    "cloud_name": "your_cloud_name",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret"
}
```

### 2. Download images

```powershell
python download_dataset.py
```

### 3. Organize the downloaded images into class folders

Before training, make sure the dataset matches the expected class-folder structure.

### 4. Train the backend model artifact

```powershell
python train.py
```

## Alternate Script: `train_model.py`

`train_model.py` is still available, but it is not the best default for the current repository.

Use it only if you intentionally want the config-driven local output workflow:

```powershell
python train_model.py
```

By default it saves model artifacts inside `ml_pipeline/` rather than directly replacing the backend model.

## Backend Integration

The backend prediction runtime expects:

```text
backend/ai/plant_disease_model.keras
backend/ai/class_names.json
```

The recommended `train.py` script writes exactly those files.

## Troubleshooting

### `config.py not found`

Create it from the template:

```powershell
Copy-Item config_template.py config.py
```

### TensorFlow install issues

- confirm you are using the ML virtual environment
- upgrade `pip`
- retry `pip install -r requirements.txt`

### Dataset validation fails

- confirm `ml_pipeline/dataset/` exists
- confirm there are at least two class folders with images
- confirm the images are inside class folders, not directly in `dataset/`

### Backend still uses the old model

If you trained with `train_model.py`, copy the final model and matching class names into `backend/ai/`, or just retrain with:

```powershell
python train.py
```

## Related Documentation

- Root run guide: [../README.md](../README.md)
- Mobile app guide: [../mobile/README.md](../mobile/README.md)
