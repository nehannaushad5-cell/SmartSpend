from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models.expense import Expense, CATEGORIES
from app.models.schema import Budget
from app.db import db
from app.utils.auth import token_required
from app.services.recommendations_service import generate_budget_recommendations

budgets_bp = Blueprint('budgets', __name__, url_prefix='/api/budgets')

@budgets_bp.route('', methods=['GET'])
@token_required
def get_budgets(current_user):
    today = datetime.utcnow().date()
    current_month_str = today.strftime('%Y-%m')

    user_budgets = Budget.query.filter_by(
        user_id=current_user.id,
        month=current_month_str
    ).all()

    # Calculate actual spending for current month per category
    first_day_of_month = today.replace(day=1)
    monthly_expenses = Expense.query.filter(
        Expense.user_id == current_user.id,
        Expense.date >= first_day_of_month
    ).all()

    cat_spending = {}
    for e in monthly_expenses:
        cat_spending[e.category] = cat_spending.get(e.category, 0.0) + e.amount

    result_budgets = []
    for b in user_budgets:
        spent = cat_spending.get(b.category, 0.0)
        pct = round((spent / b.amount * 100.0), 1) if b.amount > 0 else 0.0
        rem = round(b.amount - spent, 2)

        b_dict = b.to_dict()
        b_dict['current_spending'] = round(spent, 2)
        b_dict['remaining_amount'] = rem
        b_dict['percentage_used'] = pct
        result_budgets.append(b_dict)

    return jsonify({
        'success': True,
        'month': current_month_str,
        'budgets': result_budgets
    }), 200

@budgets_bp.route('', methods=['POST'])
@token_required
def set_budget(current_user):
    data = request.get_json() or {}
    category = data.get('category', 'Overall').strip()
    amount = data.get('amount')

    if amount is None or float(amount) <= 0:
        return jsonify({'success': False, 'message': 'Valid amount greater than 0 is required'}), 400

    today = datetime.utcnow().date()
    current_month_str = today.strftime('%Y-%m')

    budget = Budget.query.filter_by(
        user_id=current_user.id,
        category=category,
        month=current_month_str
    ).first()

    if not budget:
        budget = Budget(
            user_id=current_user.id,
            category=category,
            amount=float(amount),
            month=current_month_str
        )
        db.session.add(budget)
    else:
        budget.amount = float(amount)

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Budget set successfully for {category}',
            'budget': budget.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to set budget: {str(e)}'}), 500

@budgets_bp.route('/recommendations', methods=['GET'])
@token_required
def get_recommendations_endpoint(current_user):
    user_expenses = Expense.query.filter_by(user_id=current_user.id).all()
    expense_dicts = [e.to_dict() for e in user_expenses]

    recommendations = generate_budget_recommendations(expense_dicts)
    return jsonify({
        'success': True,
        'recommendations': recommendations
    }), 200
