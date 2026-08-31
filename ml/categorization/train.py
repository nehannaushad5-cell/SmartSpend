import os
import json
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

from ml.categorization.dataset import load_training_data

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / 'models'
MODELS_DIR.mkdir(parents=True, exist_ok=True)

TFIDF_PATH = MODELS_DIR / 'categorization_tfidf.joblib'
MODEL_PATH = MODELS_DIR / 'categorization_model.joblib'
METRICS_PATH = MODELS_DIR / 'categorization_metrics.json'

def train_categorization_model():
    """
    Trains TF-IDF + Logistic Regression categorization model.
    Computes real metrics and persists model artifacts.
    """
    print("Loading training dataset...")
    descriptions, categories = load_training_data()

    if len(descriptions) < 10:
        raise ValueError("Insufficient training data to train categorization model.")

    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        descriptions, categories, test_size=0.2, random_state=42, stratify=categories
    )

    print(f"Training dataset size: {len(X_train)} samples, Test dataset size: {len(X_test)} samples.")

    # TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        lowercase=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Logistic Regression Classifier
    classifier = LogisticRegression(C=10.0, max_iter=500, random_state=42)
    classifier.fit(X_train_vec, y_train)

    # Predictions & Metrics Evaluation
    y_pred = classifier.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro', zero_division=0)

    metrics = {
        'model_name': 'TF-IDF + Logistic Regression Categorizer',
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'accuracy': round(float(acc), 4),
        'precision_macro': round(float(prec), 4),
        'recall_macro': round(float(rec), 4),
        'f1_score_macro': round(float(f1), 4)
    }

    print("\n--- Model Evaluation Results ---")
    print(f"Accuracy:        {metrics['accuracy'] * 100:.2f}%")
    print(f"Macro Precision: {metrics['precision_macro'] * 100:.2f}%")
    print(f"Macro Recall:    {metrics['recall_macro'] * 100:.2f}%")
    print(f"Macro F1-Score:  {metrics['f1_score_macro'] * 100:.2f}%")

    # Persist Models
    joblib.dump(vectorizer, TFIDF_PATH)
    joblib.dump(classifier, MODEL_PATH)

    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\nModel artifacts successfully saved to {MODELS_DIR}")
    return metrics

if __name__ == '__main__':
    train_categorization_model()
