from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func
from app.db import db
from app.models.expense import Expense
from app.models.schema import Budget, SavingsGoal, RecurringExpense, Anomaly
from app.utils.auth import token_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('', methods=['GET'])
@token_required
def get_dashboard_summary(current_user):
    today = datetime.utcnow().date()
    current_month_str = today.strftime('%Y-%m')
    first_day_of_month = today.replace(day=1)

    # 1. Total & Monthly Spending
    all_expenses = Expense.query.filter_by(user_id=current_user.id).all()
    total_spending = sum(e.amount for e in all_expenses)

    monthly_expenses = [e for e in all_expenses if e.date >= first_day_of_month]
    monthly_spending = sum(e.amount for e in monthly_expenses)

    # 2. Monthly Budget comparison
    monthly_budget_obj = Budget.query.filter_by(
        user_id=current_user.id,
        category='Overall',
        month=current_month_str
    ).first()
    
    overall_budget = monthly_budget_obj.amount if monthly_budget_obj else 0.0

    # 3. Top Spending Category this month
    cat_totals = {}
    for e in monthly_expenses:
        cat_totals[e.category] = cat_totals.get(e.category, 0.0) + e.amount
    
    top_category = max(cat_totals.items(), key=lambda x: x[1])[0] if cat_totals else 'None'
    top_category_amount = cat_totals.get(top_category, 0.0)

    # 4. Category distribution for doughnut/pie chart
    category_breakdown = [{'category': cat, 'amount': round(amt, 2)} for cat, amt in cat_totals.items()]
    category_breakdown.sort(key=lambda x: x['amount'], reverse=True)

    # 5. Daily spending trend for current month
    daily_trend = {}
    for e in monthly_expenses:
        d_str = e.date.strftime('%Y-%m-%d')
        daily_trend[d_str] = daily_trend.get(d_str, 0.0) + e.amount

    # Sort daily trend
    daily_trend_list = [{'date': d, 'amount': round(amt, 2)} for d, amt in sorted(daily_trend.items())]

    # 6. Savings Goals summary
    goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()
    total_savings_target = sum(g.target_amount for g in goals)
    total_current_savings = sum(g.current_savings for g in goals)

    # 7. Recent Transactions (last 5)
    recent_transactions = sorted(all_expenses, key=lambda x: (x.date, x.id), reverse=True)[:5]

    return jsonify({
        'success': True,
        'metrics': {
            'total_spending': round(total_spending, 2),
            'monthly_spending': round(monthly_spending, 2),
            'overall_budget': round(overall_budget, 2),
            'budget_used_percentage': round((monthly_spending / overall_budget * 100), 1) if overall_budget > 0 else 0,
            'top_category': top_category,
            'top_category_amount': round(top_category_amount, 2),
            'total_savings_target': round(total_savings_target, 2),
            'total_current_savings': round(total_current_savings, 2),
            'total_transactions_count': len(all_expenses)
        },
        'category_breakdown': category_breakdown,
        'daily_trend': daily_trend_list,
        'recent_transactions': [e.to_dict() for e in recent_transactions]
    }), 200
