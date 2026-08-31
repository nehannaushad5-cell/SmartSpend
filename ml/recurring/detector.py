import re
import pandas as pd
from datetime import datetime
from collections import defaultdict

def detect_recurring_expenses(expenses_list):
    """
    Identifies recurring subscriptions and regular monthly expenses from historical transactions.
    Returns:
      {
        'total_monthly_recurring': float,
        'recurring_expenses': [
           {'title': str, 'amount': float, 'category': str, 'frequency': str, 'last_detected': str, 'occurrences': int}, ...
        ]
      }
    """
    if not expenses_list or len(expenses_list) == 0:
        return {'total_monthly_recurring': 0.0, 'recurring_expenses': []}

    df = pd.DataFrame(expenses_list)
    if 'description' not in df.columns or df.empty:
        return {'total_monthly_recurring': 0.0, 'recurring_expenses': []}

    # Normalize description tokens (lowercase, strip numbers/dates)
    def clean_desc_key(desc):
        d = str(desc).lower().strip()
        d = re.sub(r'[\d\W]+', ' ', d).strip()
        return d

    df['desc_key'] = df['description'].apply(clean_desc_key)
    df['date_dt'] = pd.to_datetime(df['date'])

    grouped = df.groupby('desc_key')
    detected = []

    for desc_key, group in grouped:
        if len(desc_key) < 3:
            continue

        # If merchant has 2+ occurrences
        if len(group) >= 2:
            group_sorted = group.sort_values('date_dt')
            dates = group_sorted['date_dt'].tolist()
            amounts = group_sorted['amount'].tolist()

            # Check interval between consecutive occurrences
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates) - 1)]
            avg_interval = sum(intervals) / len(intervals) if intervals else 0

            # Amount consistency check (coefficient of variation)
            amt_mean = sum(amounts) / len(amounts)
            amt_variance = sum((a - amt_mean) ** 2 for a in amounts) / len(amounts)
            amt_std = amt_variance ** 0.5

            # If interval is roughly monthly (20 to 40 days) and amount is stable (std / mean < 0.25)
            if (20 <= avg_interval <= 40) or (amt_std / (amt_mean + 1e-5) < 0.15):
                latest_row = group_sorted.iloc[-1]
                title = latest_row['description']
                cat = latest_row.get('category', 'Subscriptions')
                last_date_str = latest_row['date_dt'].strftime('%Y-%m-%d')

                detected.append({
                    'title': title,
                    'amount': round(amt_mean, 2),
                    'category': cat,
                    'frequency': 'Monthly',
                    'last_detected': last_date_str,
                    'occurrences': len(group)
                })

    total_monthly = sum(r['amount'] for r in detected)
    detected.sort(key=lambda x: x['amount'], reverse=True)

    return {
        'total_monthly_recurring': round(total_monthly, 2),
        'recurring_expenses': detected
    }
