import re
from datetime import datetime, timedelta
from app.models.expense import Expense, CATEGORIES
from app.models.schema import Budget, SavingsGoal, Anomaly
from ml.forecasting.predict import forecast_user_spending
from ml.risk.predict import predict_overspending_risk
from ml.recurring.detector import detect_recurring_expenses
from ml.anomaly_detection.predict import detect_transaction_anomalies

def process_assistant_query(user_id, query_text):
    """
    Parses user query intent and answers dynamically using live user SQLite DB data and ML model predictions.
    """
    q = query_text.lower().strip()
    today = datetime.utcnow().date()
    first_day_of_month = today.replace(day=1)

    user_expenses = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
    expense_dicts = [e.to_dict() for e in user_expenses]

    # 1. Category Spending Intent ("How much did I spend on Food this month?")
    cat_match = None
    for cat in CATEGORIES:
        if cat.lower() in q or (cat == 'Food & Dining' and ('food' in q or 'dining' in q or 'restaurant' in q)):
            cat_match = cat
            break

    if ('spend' in q or 'spent' in q or 'cost' in q or 'how much' in q) and cat_match:
        monthly_cat_expenses = [e for e in user_expenses if e.category == cat_match and e.date >= first_day_of_month]
        total_cat = sum(e.amount for e in monthly_cat_expenses)
        count_cat = len(monthly_cat_expenses)

        reply = f"This month, you have spent **₹{total_cat:,.2f}** on **{cat_match}** across {count_cat} transactions."
        return {
            'reply': reply,
            'intent': 'category_spending',
            'data': {'category': cat_match, 'total_amount': total_cat, 'transaction_count': count_cat}
        }

    # 2. Forecast Intent ("What is my projected expense for next month?" / "forecast")
    if 'forecast' in q or 'projected' in q or 'prediction' in q or 'next month' in q or 'future' in q:
        forecast_res = forecast_user_spending(expense_dicts)
        if not forecast_res.get('data_sufficient', False):
            reply = f"ℹ️ {forecast_res.get('message')}"
            return {'reply': reply, 'intent': 'forecast', 'data': forecast_res}

        next_30 = forecast_res.get('next_30_days_forecast', 0.0)
        daily_avg = forecast_res.get('projected_daily_average', 0.0)
        reply = f"📈 Based on your LSTM time-series model, your projected expenditure for the next 30 days is **₹{next_30:,.2f}** (~₹{daily_avg:,.2f}/day)."
        return {'reply': reply, 'intent': 'forecast', 'data': forecast_res}

    # 3. Biggest / Highest Expenses Intent ("Show my biggest expenses")
    if 'biggest' in q or 'highest' in q or 'largest' in q or 'top expense' in q:
        top_expenses = sorted(user_expenses, key=lambda x: x.amount, reverse=True)[:5]
        if not top_expenses:
            reply = "You don't have any recorded expenses yet."
            return {'reply': reply, 'intent': 'biggest_expenses', 'data': []}

        items_str = "\n".join([f"- **₹{e.amount:,.2f}** — {e.description} ({e.category}) on {e.date}" for e in top_expenses])
        reply = f"🏷️ Here are your top {len(top_expenses)} largest expenses:\n\n{items_str}"
        return {
            'reply': reply,
            'intent': 'biggest_expenses',
            'data': [e.to_dict() for e in top_expenses]
        }

    # 4. Budget & Overspending Track Intent ("Am I on track with my budget?")
    if 'budget' in q or 'track' in q or 'overspending' in q or 'risk' in q:
        monthly_exp = [e for e in user_expenses if e.date >= first_day_of_month]
        total_spent = sum(e.amount for e in monthly_exp)
        
        overall_budget_obj = Budget.query.filter_by(user_id=user_id, category='Overall', month=today.strftime('%Y-%m')).first()
        budget_amt = overall_budget_obj.amount if overall_budget_obj else max(total_spent * 1.25, 5000.0)

        risk_res = predict_overspending_risk(total_spent, budget_amt, current_date=today)
        risk_level = risk_res.get('risk_level')
        prob = risk_res.get('overspending_probability')
        proj = risk_res.get('projected_end_of_month')

        status_emoji = "🟢" if risk_level == 'Low Risk' else "🟡" if risk_level == 'Medium Risk' else "🔴"
        reply = f"{status_emoji} Your current overspending risk is classified as **{risk_level}** ({prob}% probability). You have spent **₹{total_spent:,.2f}** of your ₹{budget_amt:,.2f} budget. Projected month-end: **₹{proj:,.2f}**."
        return {'reply': reply, 'intent': 'budget_risk', 'data': risk_res}

    # 5. Anomaly Intent ("Did I have any unusual expenses?")
    if 'unusual' in q or 'anomaly' in q or 'outlier' in q:
        anomalies = detect_transaction_anomalies(expense_dicts)
        if not anomalies:
            reply = "✅ No unusual transactions were flagged in your recent transaction history."
            return {'reply': reply, 'intent': 'anomalies', 'data': []}

        top_anom = anomalies[0]
        reply = f"⚠️ Found {len(anomalies)} unusual transaction(s). Most prominent: **{top_anom['description']}** (₹{top_anom['amount']:,.2f}). {top_anom['reason']}"
        return {'reply': reply, 'intent': 'anomalies', 'data': anomalies}

    # 6. Savings Goal Trajectory Intent ("Will I hit my savings goal?")
    if 'savings' in q or 'goal' in q or 'hit' in q:
        goals = SavingsGoal.query.filter_by(user_id=user_id).all()
        if not goals:
            reply = "You haven't set any savings goals yet. Navigate to the **Savings Goals** page to create one!"
            return {'reply': reply, 'intent': 'savings_goals', 'data': []}

        g = goals[0]
        rem = max(g.target_amount - g.current_savings, 0.0)
        reply = f"🎯 For your goal **{g.name}**, you have saved **₹{g.current_savings:,.2f}** of ₹{g.target_amount:,.2f} ({round(g.current_savings/g.target_amount*100, 1)}%). Remaining: ₹{rem:,.2f} by {g.target_date}."
        return {'reply': reply, 'intent': 'savings_goals', 'data': [goal.to_dict() for goal in goals]}

    # 7. Recurring Subscriptions Intent ("What are my monthly subscriptions?")
    if 'recurring' in q or 'subscription' in q or 'fixed' in q:
        rec_res = detect_recurring_expenses(expense_dicts)
        total_rec = rec_res.get('total_monthly_recurring', 0.0)
        items = rec_res.get('recurring_expenses', [])

        if not items:
            reply = "No recurring monthly subscriptions detected yet."
            return {'reply': reply, 'intent': 'recurring', 'data': rec_res}

        rec_str = ", ".join([f"{r['title']} (₹{r['amount']}/mo)" for r in items[:3]])
        reply = f"💳 You have {len(items)} detected recurring expense(s) totaling **₹{total_rec:,.2f}/month**: {rec_str}."
        return {'reply': reply, 'intent': 'recurring', 'data': rec_res}

    # 8. General Summary Fallback
    monthly_exp = [e for e in user_expenses if e.date >= first_day_of_month]
    total_spent = sum(e.amount for e in monthly_exp)
    reply = f"🤖 You have spent **₹{total_spent:,.2f}** this month across {len(monthly_exp)} transactions. Ask me about your food spending, budget risk, LSTM forecast, or savings goals!"
    return {
        'reply': reply,
        'intent': 'general_summary',
        'data': {'monthly_spending': total_spent, 'transaction_count': len(monthly_exp)}
    }
