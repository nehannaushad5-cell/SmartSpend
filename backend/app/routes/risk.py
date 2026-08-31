from datetime import datetime
from flask import Blueprint, jsonify
from app.models.expense import Expense
from app.models.schema import Budget
from app.utils.auth import token_required
from ml.risk.predict import predict_overspending_risk

risk_bp = Blueprint('risk', __name__, url_prefix='/api/budget-risk')

@risk_bp.route('', methods=['GET'])
@token_required
def get_budget_risk_analysis(current_user):
    today = datetime.utcnow().date()
    first_day_of_month = today.replace(day=1)
    current_month_str = today.strftime('%Y-%m')

    # Fetch user expenses for current month
    monthly_expenses = Expense.query.filter(
        Expense.user_id == current_user.id,
        Expense.date >= first_day_of_month
    ).all()

    total_monthly_spending = sum(e.amount for e in monthly_expenses)

    # Fetch Overall Budget if set
    overall_budget_obj = Budget.query.filter_by(
        user_id=current_user.id,
        category='Overall',
        month=current_month_str
    ).first()

    if overall_budget_obj and overall_budget_obj.amount > 0:
        overall_budget_amount = overall_budget_obj.amount
    else:
        # Default smart budget benchmark if user hasn't explicitly configured a budget yet
        overall_budget_amount = max(total_monthly_spending * 1.25, 5000.0)

    # Compute overall budget risk
    overall_risk = predict_overspending_risk(total_monthly_spending, overall_budget_amount, current_date=today)

    # Category Level Risk Analysis
    cat_spending = {}
    for e in monthly_expenses:
        cat_spending[e.category] = cat_spending.get(e.category, 0.0) + e.amount

    # Category budgets set by user
    cat_budgets = Budget.query.filter(
        Budget.user_id == current_user.id,
        Budget.category != 'Overall',
        Budget.month == current_month_str
    ).all()
    cat_budget_map = {b.category: b.amount for b in cat_budgets}

    category_risks = []
    for cat_name, spent in cat_spending.items():
        cat_b_amt = cat_budget_map.get(cat_name)
        if not cat_b_amt:
            # Default estimated category budget benchmark
            cat_b_amt = max(spent * 1.2, 1000.0)

        c_risk = predict_overspending_risk(spent, cat_b_amt, current_date=today)
        c_risk['category'] = cat_name
        category_risks.append(c_risk)

    category_risks.sort(key=lambda x: x['overspending_probability'], reverse=True)

    return jsonify({
        'success': True,
        'overall_risk': overall_risk,
        'category_risks': category_risks
    }), 200
