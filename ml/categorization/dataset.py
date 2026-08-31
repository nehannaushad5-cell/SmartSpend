import os
import pandas as pd
from pathlib import Path

SEED_DATA_PATH = Path(__file__).resolve().parent.parent.parent / 'data' / 'raw' / 'categorization_seed.csv'

def load_training_data(include_user_corrections=False, db_session=None):
    """
    Loads training data from seed CSV and optionally user-corrected database records.
    Returns (descriptions_list, categories_list)
    """
    descriptions = []
    categories = []

    if SEED_DATA_PATH.exists():
        df_seed = pd.read_csv(SEED_DATA_PATH)
        df_seed.dropna(subset=['description', 'category'], inplace=True)
        descriptions.extend(df_seed['description'].str.strip().tolist())
        categories.extend(df_seed['category'].str.strip().tolist())

    if include_user_corrections and db_session is not None:
        try:
            from app.models.expense import Expense
            corrected_expenses = db_session.query(Expense).filter_by(is_user_corrected=True).all()
            for exp in corrected_expenses:
                if exp.description and exp.category:
                    descriptions.append(exp.description.strip())
                    categories.append(exp.category.strip())
        except Exception as e:
            print(f"Warning: Could not fetch user corrections from DB: {e}")

    return descriptions, categories
