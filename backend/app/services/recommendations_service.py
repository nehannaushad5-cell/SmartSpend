import numpy as np
import pandas as pd
from app.models.expense import Expense, CATEGORIES

def generate_budget_recommendations(user_expenses):
    """
    Computes recommended monthly budgets per category based on:
    - 90-day historical average spending
    - Category spending volatility (std dev)
    - Buffer buffer margin for variability
    """
    if not user_expenses:
        recommendations = []
        for cat in CATEGORIES[:6]:
            recommendations.append({
                'category': cat,
                'historical_avg': 0.0,
                'recommended_budget': 5000.0,
                'reason': 'Default starting budget recommendation. Add expenses to personalize.'
            })
        return {
            'disclaimer': 'Your recommended budget is based on your recent average spending and spending variability. Avoid presenting recommendations as professional financial advice.',
            'recommendations': recommendations
        }

    df = pd.DataFrame(user_expenses)
    df['date_dt'] = pd.to_datetime(df['date'])
    
    # Calculate months span
    min_date = df['date_dt'].min()
    max_date = df['date_dt'].max()
    days_span = max((max_date - min_date).days, 1)
    months_span = max(days_span / 30.44, 1.0)

    recommendations = []
    
    for cat in CATEGORIES:
        cat_df = df[df['category'] == cat]
        if cat_df.empty:
            continue

        total_cat_spending = cat_df['amount'].sum()
        hist_monthly_avg = total_cat_spending / months_span

        # Compute volatility (standard deviation of transaction amounts)
        amounts = cat_df['amount'].values
        volatility = np.std(amounts) if len(amounts) > 1 else (hist_monthly_avg * 0.1)

        # Recommendation formula: monthly average + 0.5 * volatility (with 10% buffer)
        recommended = max(hist_monthly_avg * 1.10, hist_monthly_avg + (0.5 * volatility))
        recommended = round(recommended, -1)  # round to nearest 10

        recommendations.append({
            'category': cat,
            'historical_avg': round(hist_monthly_avg, 2),
            'recommended_budget': round(recommended, 2),
            'volatility': round(float(volatility), 2),
            'reason': f"Based on your recent average of ₹{round(hist_monthly_avg, 2):,.2f}/mo and spending variability (±₹{round(volatility, 2)})."
        })

    recommendations.sort(key=lambda x: x['recommended_budget'], reverse=True)

    return {
        'disclaimer': 'Your recommended budget is based on your recent average spending and spending variability.',
        'recommendations': recommendations
    }
