"""
HEALTHAI — Prescription NLP Training Pipeline
=============================================
Downloads the Kaggle 'Illegible Medical Prescription Images Dataset',
runs OCR on prescription images, extracts text, and trains a TF-IDF +
Logistic Regression classifier to categorize medication text into
clinical categories (General, BP, Diabetes, Heart, Asthma, Allergy).

PREREQUISITES
-------------
1. Install Tesseract OCR binary:
   - Windows: winget install UB-Mannheim.TesseractOCR
   - macOS:   brew install tesseract
   - Linux:   sudo apt-get install tesseract-ocr

2. Configure Kaggle API credentials:
   - Go to https://www.kaggle.com/settings → API → Create New Token
   - Save the downloaded kaggle.json to:
       Windows: C:\\Users\\<you>\\.kaggle\\kaggle.json
       macOS/Linux: ~/.kaggle/kaggle.json
   - Or set environment variables: KAGGLE_USERNAME and KAGGLE_KEY

3. Install Python dependencies:
   pip install -r scripts/requirements.txt

USAGE
-----
  python scripts/train_prescription_nlp.py

OUTPUT
------
  models/prescription_nlp_model.pkl   — trained sklearn pipeline
  models/label_encoder.pkl            — category label encoder
  models/training_report.json         — accuracy metrics + sample predictions
"""

import os
import sys
import json
import re
import logging
import warnings
from pathlib import Path
from typing import List, Tuple, Dict, Any

import numpy as np
import joblib
from tqdm import tqdm

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

KAGGLE_DATASET = "mehaksingal/illegible-medical-prescription-images-dataset"
MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

# Medical NLP keyword patterns mapped to categories.
# Used for:
#   1. Labelling unlabelled OCR-extracted text (weak supervision)
#   2. Post-processing model output for confidence boosting
CATEGORY_PATTERNS: Dict[str, List[str]] = {
    "BP": [
        "amlodipine", "lisinopril", "losartan", "atenolol", "metoprolol",
        "ramipril", "valsartan", "nifedipine", "hydrochlorothiazide", "hctz",
        "hypertension", "blood pressure", "bp", "antihypertensive",
    ],
    "Diabetes": [
        "metformin", "glipizide", "glyburide", "insulin", "glargine",
        "sitagliptin", "empagliflozin", "dapagliflozin", "pioglitazone",
        "diabetes", "diabetic", "blood sugar", "glucose", "hba1c",
        "hypoglycaemic", "hypoglycemic",
    ],
    "Heart": [
        "aspirin", "clopidogrel", "warfarin", "atorvastatin", "rosuvastatin",
        "digoxin", "amiodarone", "nitroglycerin", "furosemide", "carvedilol",
        "cardiac", "cardio", "heart", "angina", "palpitation", "arrhythmia",
    ],
    "Asthma": [
        "salbutamol", "albuterol", "budesonide", "fluticasone", "salmeterol",
        "montelukast", "theophylline", "ipratropium", "inhaler", "nebulizer",
        "asthma", "bronchial", "wheeze", "spirometry", "copd", "inhale",
    ],
    "Allergy": [
        "cetirizine", "loratadine", "fexofenadine", "diphenhydramine",
        "chlorpheniramine", "hydroxyzine", "prednisolone", "dexamethasone",
        "allerg", "antihistamine", "rhinitis", "urticaria", "anaphylaxis",
    ],
}

# ── OCR Setup ─────────────────────────────────────────────────────────────────

def _setup_tesseract() -> None:
    """Auto-detect Tesseract installation on Windows."""
    try:
        import pytesseract
        # Common Windows install paths
        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        for path in candidates:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                log.info(f"Tesseract found at: {path}")
                return
        # Try PATH — pytesseract will auto-detect if in PATH
        log.warning("Tesseract not found in common paths. Ensure it is in PATH.")
    except ImportError:
        log.error("pytesseract not installed. Run: pip install pytesseract")
        sys.exit(1)


# ── Dataset Download ──────────────────────────────────────────────────────────

def download_dataset() -> Path:
    """
    Download the prescription image dataset from Kaggle using kagglehub.
    Returns the local path to the downloaded dataset.
    """
    try:
        import kagglehub
    except ImportError:
        log.error("kagglehub not installed. Run: pip install kagglehub")
        sys.exit(1)

    log.info(f"Downloading Kaggle dataset: {KAGGLE_DATASET}")
    log.info("This may take a few minutes on first run...")

    path = kagglehub.dataset_download(KAGGLE_DATASET)
    log.info(f"Dataset downloaded to: {path}")
    return Path(path)


# ── Image Preprocessing & OCR ────────────────────────────────────────────────

def preprocess_image(image_path: Path):
    """
    Preprocess a prescription image for better OCR accuracy:
    - Convert to grayscale
    - Apply Gaussian blur to reduce noise
    - Apply Otsu's adaptive threshold (binarization)
    - Upscale if too small
    """
    try:
        import cv2
        from PIL import Image

        img = cv2.imread(str(image_path))
        if img is None:
            img_pil = Image.open(image_path).convert("RGB")
            img = np.array(img_pil)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Upscale small images for better OCR
        h, w = gray.shape
        if h < 300 or w < 300:
            scale = max(300 / h, 300 / w)
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # Denoise
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)

        # Adaptive threshold
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        return thresh

    except Exception as e:
        log.warning(f"Preprocessing failed for {image_path.name}: {e}")
        return None


def ocr_image(image_path: Path) -> str:
    """Run Tesseract OCR on a preprocessed prescription image."""
    import pytesseract
    from PIL import Image

    processed = preprocess_image(image_path)
    if processed is None:
        return ""

    try:
        # PSM 6 = assume uniform block of text (good for prescriptions)
        config = "--psm 6 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-:() "
        text = pytesseract.image_to_string(processed, config=config)
        return text.strip()
    except Exception as e:
        log.warning(f"OCR failed for {image_path.name}: {e}")
        return ""


# ── Weak Supervision Labelling ────────────────────────────────────────────────

def assign_category(text: str) -> str:
    """
    Assign a medical category to extracted prescription text using
    keyword matching (weak supervision). Falls back to 'General'.
    """
    text_lower = text.lower()
    scores: Dict[str, int] = {cat: 0 for cat in CATEGORY_PATTERNS}

    for category, keywords in CATEGORY_PATTERNS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[category] += 1

    best_cat = max(scores, key=lambda c: scores[c])
    if scores[best_cat] == 0:
        return "General"
    return best_cat


def clean_text(text: str) -> str:
    """Normalize OCR-extracted text."""
    text = re.sub(r"\s+", " ", text)           # collapse whitespace
    text = re.sub(r"[^\w\s.,/()\-:]", "", text) # strip noise chars
    return text.strip().lower()


# ── Dataset Builder ───────────────────────────────────────────────────────────

def build_dataset(dataset_path: Path) -> Tuple[List[str], List[str]]:
    """
    Walk the dataset directory, OCR each image, and return
    (texts, labels) lists for training.
    """
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}
    image_paths = [
        p for p in dataset_path.rglob("*")
        if p.suffix.lower() in image_extensions
    ]

    if not image_paths:
        log.error(f"No images found in dataset path: {dataset_path}")
        sys.exit(1)

    log.info(f"Found {len(image_paths)} prescription images. Running OCR...")

    texts: List[str] = []
    labels: List[str] = []

    # Try to read category from directory name (common Kaggle structure)
    for img_path in tqdm(image_paths, desc="OCR Processing", unit="img"):
        raw_text = ocr_image(img_path)
        if not raw_text or len(raw_text) < 10:
            # Skip blank / unreadable images
            continue

        cleaned = clean_text(raw_text)
        texts.append(cleaned)

        # Prefer directory-based label (if structured dataset), fallback to keyword
        parent_name = img_path.parent.name.strip()
        category_map = {
            "bp": "BP", "blood_pressure": "BP", "hypertension": "BP",
            "diabetes": "Diabetes", "diabetic": "Diabetes",
            "heart": "Heart", "cardiac": "Heart",
            "asthma": "Asthma", "respiratory": "Asthma",
            "allergy": "Allergy", "antihistamine": "Allergy",
            "general": "General",
        }
        label = category_map.get(parent_name.lower(), None)
        if label is None:
            label = assign_category(cleaned)

        labels.append(label)

    log.info(f"Extracted {len(texts)} usable text samples from {len(image_paths)} images")
    return texts, labels


# ── Model Training ────────────────────────────────────────────────────────────

def train_model(texts: List[str], labels: List[str]) -> Dict[str, Any]:
    """
    Train a TF-IDF + Logistic Regression pipeline on extracted prescription text.
    Returns metrics dictionary.
    """
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import classification_report, accuracy_score

    log.info("Training TF-IDF + Logistic Regression NLP model...")

    le = LabelEncoder()
    y = le.fit_transform(labels)

    # Split: use stratify if enough samples per class
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            texts, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            texts, y, test_size=0.2, random_state=42
        )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3),          # unigrams, bigrams, trigrams
            max_features=15_000,
            sublinear_tf=True,           # log TF scaling — helps with medical terms
            analyzer="word",
            min_df=1,
        )),
        ("clf", LogisticRegression(
            C=5.0,
            max_iter=1000,
            multi_class="multinomial",
            solver="lbfgs",
            random_state=42,
        )),
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    report = classification_report(
        y_test, y_pred,
        target_names=le.classes_,
        output_dict=True,
        zero_division=0,
    )

    log.info(f"Model accuracy: {accuracy:.2%}")
    log.info("\n" + classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    # Save model and encoder
    model_path = MODELS_DIR / "prescription_nlp_model.pkl"
    encoder_path = MODELS_DIR / "label_encoder.pkl"
    joblib.dump(pipeline, model_path)
    joblib.dump(le, encoder_path)
    log.info(f"Model saved to: {model_path}")
    log.info(f"Label encoder saved to: {encoder_path}")

    # Save training report
    report_data = {
        "accuracy": round(accuracy, 4),
        "total_samples": len(texts),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "categories": list(le.classes_),
        "classification_report": report,
        "model_path": str(model_path),
        "dataset": KAGGLE_DATASET,
    }
    report_path = MODELS_DIR / "training_report.json"
    with open(report_path, "w") as f:
        json.dump(report_data, f, indent=2)
    log.info(f"Training report saved to: {report_path}")

    return report_data


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("  HealthAI — Prescription NLP Training Pipeline")
    log.info(f"  Dataset: {KAGGLE_DATASET}")
    log.info("=" * 60)

    _setup_tesseract()

    # Step 1: Download dataset from Kaggle
    dataset_path = download_dataset()

    # Step 2: OCR all prescription images & build labelled dataset
    texts, labels = build_dataset(dataset_path)

    if len(texts) < 5:
        log.error(
            "Too few usable samples extracted from images.\n"
            "Ensure Tesseract is installed and the dataset downloaded correctly."
        )
        sys.exit(1)

    # Log category distribution
    from collections import Counter
    dist = Counter(labels)
    log.info(f"Category distribution: {dict(dist)}")

    # Step 3: Train and evaluate model
    metrics = train_model(texts, labels)

    log.info("\n" + "=" * 60)
    log.info("  TRAINING COMPLETE")
    log.info(f"  Accuracy: {metrics['accuracy']:.2%}")
    log.info(f"  Samples:  {metrics['total_samples']}")
    log.info(f"  Model:    {metrics['model_path']}")
    log.info("=" * 60)
    log.info("\nNext step: Start the inference server:")
    log.info("  uvicorn scripts.prescription_inference_server:app --port 8000 --reload")


if __name__ == "__main__":
    main()
