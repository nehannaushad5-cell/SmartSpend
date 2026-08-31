import os
import joblib
from pathlib import Path
import numpy as np

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
TFIDF_PATH = MODELS_DIR / 'categorization_tfidf.joblib'
MODEL_PATH = MODELS_DIR / 'categorization_model.joblib'

_vectorizer = None
_classifier = None

def _load_model():
    global _vectorizer, _classifier
    if _vectorizer is None or _classifier is None:
        if TFIDF_PATH.exists() and MODEL_PATH.exists():
            _vectorizer = joblib.load(TFIDF_PATH)
            _classifier = joblib.load(MODEL_PATH)
        else:
            return False
    return True

def predict_expense_category(description):
    """
    Predicts category and confidence score for a transaction description.
    Returns: (predicted_category, confidence_score)
    """
    if not description or not str(description).strip():
        return 'Other', 0.5

    desc_clean = str(description).strip().lower()

    if _load_model():
        try:
            vec = _vectorizer.transform([desc_clean])
            probs = _classifier.predict_proba(vec)[0]
            max_idx = np.argmax(probs)
            confidence = float(probs[max_idx])
            category = str(_classifier.classes_[max_idx])
            return category, round(confidence, 4)
        except Exception as e:
            print(f"Warning: ML Categorization inference failed: {e}")

    # Fallback rule engine if model artifacts are unavailable
    from app.routes.expenses import fallback_predict_category
    return fallback_predict_category(desc_clean)
