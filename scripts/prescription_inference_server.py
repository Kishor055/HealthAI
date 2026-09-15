"""
HEALTHAI — Prescription NLP Inference Server
=============================================
FastAPI server that loads the trained prescription NLP model and exposes
endpoints for the Genkit flow to call as an HTTP tool.

USAGE
-----
  uvicorn scripts.prescription_inference_server:app --port 8000 --reload

  Or from project root:
  python -m uvicorn scripts.prescription_inference_server:app --port 8000

ENDPOINTS
---------
  GET  /health          — health check, returns model status
  POST /analyze/text    — analyze raw prescription text
  POST /analyze/image   — analyze a prescription image (base64 encoded)
"""

import os
import sys
import json
import base64
import logging
import re
from pathlib import Path
from typing import Optional
from io import BytesIO

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

log = logging.getLogger("uvicorn.error")

# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "models"
MODEL_PATH = MODELS_DIR / "prescription_nlp_model.pkl"
ENCODER_PATH = MODELS_DIR / "label_encoder.pkl"
REPORT_PATH = MODELS_DIR / "training_report.json"

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="HealthAI Prescription NLP API",
    description="Inference server for the prescription NLP model trained on the Kaggle Illegible Medical Prescription Images Dataset.",
    version="1.0.0",
)

# Allow calls from Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:9002", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Loading ─────────────────────────────────────────────────────────────

_pipeline = None
_label_encoder = None
_training_report: dict = {}


def _load_models():
    global _pipeline, _label_encoder, _training_report

    if not MODEL_PATH.exists():
        log.warning(
            f"Model not found at {MODEL_PATH}. "
            "Run: python scripts/train_prescription_nlp.py"
        )
        return

    _pipeline = joblib.load(MODEL_PATH)
    _label_encoder = joblib.load(ENCODER_PATH)
    log.info(f"Prescription NLP model loaded from {MODEL_PATH}")

    if REPORT_PATH.exists():
        with open(REPORT_PATH) as f:
            _training_report = json.load(f)


@app.on_event("startup")
async def startup_event():
    _load_models()


# ── Shared Utilities ──────────────────────────────────────────────────────────

# Medical keyword→category patterns for confidence boosting
CATEGORY_PATTERNS = {
    "BP": [
        "amlodipine", "lisinopril", "losartan", "atenolol", "metoprolol",
        "ramipril", "hypertension", "blood pressure",
    ],
    "Diabetes": [
        "metformin", "glipizide", "insulin", "glargine", "sitagliptin",
        "diabetes", "blood sugar", "glucose",
    ],
    "Heart": [
        "aspirin", "clopidogrel", "warfarin", "atorvastatin", "rosuvastatin",
        "cardiac", "heart", "angina",
    ],
    "Asthma": [
        "salbutamol", "albuterol", "budesonide", "fluticasone", "montelukast",
        "inhaler", "asthma", "bronchial",
    ],
    "Allergy": [
        "cetirizine", "loratadine", "fexofenadine", "diphenhydramine",
        "allerg", "antihistamine", "rhinitis",
    ],
}


def _keyword_confidence(text: str) -> dict:
    """Return per-category keyword hit counts."""
    text_lower = text.lower()
    return {
        cat: sum(1 for kw in kws if kw in text_lower)
        for cat, kws in CATEGORY_PATTERNS.items()
    }


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s.,/()\-:]", "", text)
    return text.strip().lower()


def _predict(text: str) -> dict:
    """Run the NLP pipeline on text and return structured result."""
    if _pipeline is None or _label_encoder is None:
        # Fallback: keyword-only classification
        keyword_scores = _keyword_confidence(text)
        best = max(keyword_scores, key=lambda k: keyword_scores[k])
        category = best if keyword_scores[best] > 0 else "General"
        return {
            "category": category,
            "confidence": 0.5,
            "confidence_scores": {k: round(v / max(sum(keyword_scores.values()), 1), 3) for k, v in keyword_scores.items()},
            "model_used": "keyword_fallback",
            "warning": "NLP model not loaded. Run train_prescription_nlp.py first.",
        }

    cleaned = _clean_text(text)
    probas = _pipeline.predict_proba([cleaned])[0]
    pred_idx = int(np.argmax(probas))
    category = _label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probas[pred_idx])

    all_scores = {
        label: round(float(prob), 4)
        for label, prob in zip(_label_encoder.classes_, probas)
    }

    # Keyword boost: if model is uncertain, fall back to keyword result
    keyword_scores = _keyword_confidence(text)
    kw_best = max(keyword_scores, key=lambda k: keyword_scores[k])
    if confidence < 0.45 and keyword_scores[kw_best] > 0:
        category = kw_best
        confidence = min(0.60, confidence + 0.15)

    return {
        "category": category,
        "confidence": round(confidence, 4),
        "confidence_scores": all_scores,
        "model_used": "tfidf_logistic_regression",
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., description="Raw prescription text or OCR output to classify.")


class ImageAnalysisRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded prescription image (JPEG/PNG).")
    mime_type: Optional[str] = Field("image/jpeg", description="MIME type of the image.")


class AnalysisResult(BaseModel):
    category: str
    confidence: float
    confidence_scores: dict
    model_used: str
    extracted_text: Optional[str] = None
    warning: Optional[str] = None
    model_accuracy: Optional[float] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": _pipeline is not None,
        "categories": list(_label_encoder.classes_) if _label_encoder else [],
        "training_accuracy": _training_report.get("accuracy"),
        "trained_on": _training_report.get("dataset"),
        "total_training_samples": _training_report.get("total_samples"),
    }


@app.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text(request: TextAnalysisRequest):
    """
    Classify raw prescription text into a medical category.
    Called by the Genkit `prescriptionNLPLookup` tool.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    result = _predict(request.text)
    return AnalysisResult(
        **result,
        extracted_text=request.text[:500],  # truncate for response
        model_accuracy=_training_report.get("accuracy"),
    )


@app.post("/analyze/image", response_model=AnalysisResult)
async def analyze_image(request: ImageAnalysisRequest):
    """
    Accept a base64-encoded prescription image, run OCR, then classify.
    Called by the Genkit flow when analyzing uploaded prescriptions.
    """
    try:
        import pytesseract
        import cv2
        from PIL import Image

        # Decode base64 image
        img_data = request.image_base64
        if "," in img_data:
            img_data = img_data.split(",", 1)[1]

        img_bytes = base64.b64decode(img_data)
        img_pil = Image.open(BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(img_pil)

        # Preprocess
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        h, w = gray.shape
        if h < 300 or w < 300:
            scale = max(300 / h, 300 / w)
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # OCR
        config = "--psm 6 --oem 3"
        extracted_text = pytesseract.image_to_string(thresh, config=config).strip()

        if not extracted_text or len(extracted_text) < 5:
            return AnalysisResult(
                category="General",
                confidence=0.0,
                confidence_scores={},
                model_used="ocr_failed",
                extracted_text="",
                warning="OCR could not extract readable text from this image.",
            )

        result = _predict(extracted_text)
        return AnalysisResult(
            **result,
            extracted_text=extracted_text[:500],
            model_accuracy=_training_report.get("accuracy"),
        )

    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail=f"OCR dependencies not installed: {e}. Install pytesseract, opencv-python, and Pillow.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


@app.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...)):
    """
    Accept a multipart file upload, run OCR, and classify.
    Alternative to /analyze/image for direct file uploads.
    """
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    req = ImageAnalysisRequest(image_base64=b64, mime_type=file.content_type)
    return await analyze_image(req)
