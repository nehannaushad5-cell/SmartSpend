import re
import io
import pandas as pd
from datetime import datetime
from app.models.expense import Expense, CATEGORIES, PAYMENT_METHODS
from app.routes.expenses import fallback_predict_category
from app.db import db

# Column alias dictionary for intelligent header mapping
COLUMN_ALIASES = {
    'date': ['date', 'txn date', 'transaction date', 'date of transaction', 'posted date', 'dt', 'timestamp'],
    'description': ['description', 'desc', 'particulars', 'narration', 'details', 'payee', 'title', 'item'],
    'amount': ['amount', 'amt', 'value', 'cost', 'price', 'total', 'debit', 'transaction amount'],
    'category': ['category', 'cat', 'type', 'genre', 'tag', 'group'],
    'payment_method': ['payment method', 'payment_method', 'mode', 'payment mode', 'method', 'channel', 'pay via']
}

def map_csv_columns(df_columns):
    """
    Intelligently maps CSV column headers to standard field names.
    Returns a dict: {standard_name: csv_column_name}
    """
    mapping = {}
    normalized_headers = {str(col).strip().lower(): col for col in df_columns}
    
    for std_name, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_headers:
                mapping[std_name] = normalized_headers[alias]
                break
                
    return mapping

def clean_amount(val):
    """
    Cleans amount string by removing currency symbols, commas, and formatting to float.
    """
    if pd.isna(val) or val is None or str(val).strip() == '':
        return None
    val_str = str(val).strip()
    # Remove currency symbols, spaces, commas
    cleaned = re.sub(r'[₹$€£\s,]', '', val_str)
    try:
        amt = float(cleaned)
        return abs(amt) if amt != 0 else None
    except ValueError:
        return None

def parse_flexible_date(val):
    """
    Parses flexible date strings into a datetime.date object.
    Supports YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY, YYYY/MM/DD, DD/MM/YYYY, etc.
    """
    if pd.isna(val) or val is None or str(val).strip() == '':
        return None
    val_str = str(val).strip()
    
    # Try pandas to_datetime parsing
    try:
        dt = pd.to_datetime(val_str, dayfirst=True)
        if not pd.isna(dt):
            return dt.date()
    except Exception:
        pass
        
    date_formats = [
        '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y',
        '%Y/%m/%d', '%b %d, %Y', '%B %d, %Y', '%d-%b-%Y'
    ]
    for fmt in date_formats:
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            continue
            
    return None

def process_csv_import(file_stream, user_id):
    """
    Main pipeline for CSV validation, cleaning, duplicate detection, category prediction, and DB insertion.
    """
    try:
        df = pd.read_csv(file_stream, dtype=str)
    except Exception as e:
        return {
            'success': False,
            'message': f'Failed to parse CSV file: {str(e)}'
        }

    if df.empty:
        return {
            'success': False,
            'message': 'CSV file is empty.'
        }

    col_map = map_csv_columns(df.columns)
    
    # Required columns check
    if 'date' not in col_map or 'description' not in col_map or 'amount' not in col_map:
        return {
            'success': False,
            'message': f'Missing required CSV columns. Found headers: {list(df.columns)}. Need at least Date, Description, and Amount.'
        }

    date_col = col_map['date']
    desc_col = col_map['description']
    amt_col = col_map['amount']
    cat_col = col_map.get('category')
    pm_col = col_map.get('payment_method')

    # Fetch existing user expenses to check for duplicates in DB
    existing_expenses = Expense.query.filter_by(user_id=user_id).all()
    existing_set = {
        (e.date.strftime('%Y-%m-%d'), round(e.amount, 2), e.description.strip().lower())
        for e in existing_expenses
    }

    batch_set = set()

    imported_records = []
    failed_records = []
    duplicate_records = []
    auto_categorized_count = 0
    new_expenses_to_add = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed header + 1
        raw_row_dict = row.to_dict()

        # Extract values
        raw_date = row.get(date_col)
        raw_desc = row.get(desc_col)
        raw_amt = row.get(amt_col)
        raw_cat = row.get(cat_col) if cat_col else None
        raw_pm = row.get(pm_col) if pm_col else None

        # 1. Clean description
        description = str(raw_desc).strip() if not pd.isna(raw_desc) else ''
        if not description:
            failed_records.append({
                'row': row_num,
                'raw_data': raw_row_dict,
                'reason': 'Missing transaction description'
            })
            continue

        # 2. Clean date
        parsed_date = parse_flexible_date(raw_date)
        if not parsed_date:
            failed_records.append({
                'row': row_num,
                'raw_data': raw_row_dict,
                'reason': f'Invalid or unparseable date format: "{raw_date}"'
            })
            continue

        # 3. Clean amount
        cleaned_amount = clean_amount(raw_amt)
        if cleaned_amount is None or cleaned_amount <= 0:
            failed_records.append({
                'row': row_num,
                'raw_data': raw_row_dict,
                'reason': f'Invalid amount value: "{raw_amt}"'
            })
            continue

        # 4. Duplicate Check
        dedup_key = (parsed_date.strftime('%Y-%m-%d'), round(cleaned_amount, 2), description.lower())
        if dedup_key in existing_set or dedup_key in batch_set:
            duplicate_records.append({
                'row': row_num,
                'raw_data': raw_row_dict,
                'reason': 'Duplicate transaction skipped'
            })
            continue

        batch_set.add(dedup_key)

        # 5. Category handling & prediction
        category = str(raw_cat).strip() if raw_cat and not pd.isna(raw_cat) else ''
        predicted_cat, conf = fallback_predict_category(description)

        if not category or category.lower() in ['auto', 'none', 'nan', 'uncategorized', '']:
            category = predicted_cat
            auto_categorized_count += 1

        # 6. Payment method handling
        payment_method = str(raw_pm).strip() if raw_pm and not pd.isna(raw_pm) else 'UPI'
        if payment_method not in PAYMENT_METHODS:
            payment_method = 'UPI'

        # Construct Expense object
        expense = Expense(
            user_id=user_id,
            amount=cleaned_amount,
            description=description,
            date=parsed_date,
            category=category if category in CATEGORIES else 'Other',
            predicted_category=predicted_cat,
            category_confidence=conf,
            payment_method=payment_method
        )
        new_expenses_to_add.append(expense)

    # Database Batch Save
    if new_expenses_to_add:
        try:
            db.session.add_all(new_expenses_to_add)
            db.session.commit()
            imported_records = [e.to_dict() for e in new_expenses_to_add]
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'message': f'Database error during CSV import commit: {str(e)}'
            }

    return {
        'success': True,
        'summary': {
            'total_rows': len(df),
            'imported_count': len(imported_records),
            'duplicate_count': len(duplicate_records),
            'failed_count': len(failed_records),
            'auto_categorized_count': auto_categorized_count
        },
        'failed_records': failed_records,
        'duplicate_records': duplicate_records,
        'imported_expenses': imported_records
    }
