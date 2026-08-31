import pandas as pd
from datetime import datetime

def run_what_if_simulation(user_expenses, percentage_reductions, savings_goals=None):
    """
    Simulates spending reductions based on user percentage sliders.
    percentage_reductions: dict of {category: reduction_percentage} e.g. {'Food & Dining': 15, 'Shopping': 20}
    """
    if not user_expenses:
        return {
            'monthly_savings': 0.0,
            'annual_savings': 0.0,
            'baseline_monthly_spending': 0.0,
            'simulated_monthly_spending': 0.0,
            'category_impacts': [],
            'goal_impacts': []
        }

    df = pd.DataFrame(user_expenses)
    df['date_dt'] = pd.to_datetime(df['date'])

    min_date = df['date_dt'].min()
    max_date = df['date_dt'].max()
    days_span = max((max_date - min_date).days, 1)
    months_span = max(days_span / 30.44, 1.0)

    # Calculate baseline monthly spending per category
    baseline_cat = df.groupby('category')['amount'].sum() / months_span
    baseline_monthly = baseline_cat.sum()

    simulated_cat = {}
    category_impacts = []

    total_monthly_savings = 0.0

    for cat_name, base_amt in baseline_cat.items():
        red_pct = float(percentage_reductions.get(cat_name, 0.0))
        red_pct = max(0.0, min(red_pct, 100.0))  # Clamp to [0, 100]

        reduced_amt = base_amt * (1.0 - (red_pct / 100.0))
        saved_amt = base_amt - reduced_amt
        total_monthly_savings += saved_amt

        simulated_cat[cat_name] = round(reduced_amt, 2)
        category_impacts.append({
            'category': cat_name,
            'reduction_percentage': red_pct,
            'baseline_monthly': round(base_amt, 2),
            'simulated_monthly': round(reduced_amt, 2),
            'monthly_savings': round(saved_amt, 2),
            'annual_savings': round(saved_amt * 12.0, 2)
        })

    total_annual_savings = total_monthly_savings * 12.0
    simulated_monthly = max(0.0, baseline_monthly - total_monthly_savings)

    # Goal Impact Calculation
    goal_impacts = []
    if savings_goals:
        for g in savings_goals:
            target = g.get('target_amount', 0.0)
            current = g.get('current_savings', 0.0)
            rem = max(target - current, 0.0)

            if rem > 0 and total_monthly_savings > 0:
                # Assuming user saves current baseline savings + extra simulated savings
                baseline_months = rem / max(total_monthly_savings * 0.5, 1000.0)
                new_months = rem / (max(total_monthly_savings * 0.5, 1000.0) + total_monthly_savings)
                months_saved = max(round(baseline_months - new_months, 1), 0.1)

                goal_impacts.append({
                    'goal_name': g.get('name'),
                    'target_amount': target,
                    'remaining_amount': round(rem, 2),
                    'months_earlier': months_saved,
                    'summary': f"Goal reached ~{months_saved} months earlier by saving ₹{round(total_monthly_savings, 2):,.2f}/month."
                })

    category_impacts.sort(key=lambda x: x['monthly_savings'], reverse=True)

    return {
        'baseline_monthly_spending': round(baseline_monthly, 2),
        'simulated_monthly_spending': round(simulated_monthly, 2),
        'monthly_savings': round(total_monthly_savings, 2),
        'annual_savings': round(total_annual_savings, 2),
        'category_impacts': category_impacts,
        'goal_impacts': goal_impacts
    }
