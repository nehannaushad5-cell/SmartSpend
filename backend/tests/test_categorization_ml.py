import pytest
from ml.categorization.predict import predict_expense_category
from ml.categorization.train import train_categorization_model

def test_model_training():
    metrics = train_categorization_model()
    assert 'accuracy' in metrics
    assert metrics['accuracy'] >= 0.70
    assert metrics['f1_score_macro'] >= 0.65

def test_predict_food_and_dining():
    cat, conf = predict_expense_category("Swiggy biryani dinner")
    assert cat == "Food & Dining"
    assert conf > 0.50

def test_predict_transportation():
    cat, conf = predict_expense_category("Uber cab ride to station")
    assert cat == "Transportation"
    assert conf > 0.50

def test_predict_subscriptions():
    cat, conf = predict_expense_category("Netflix monthly plan subscription")
    assert cat == "Subscriptions"
    assert conf > 0.50

def test_predict_groceries():
    cat, conf = predict_expense_category("Blinkit instant groceries delivery")
    assert cat == "Groceries"
    assert conf > 0.50
