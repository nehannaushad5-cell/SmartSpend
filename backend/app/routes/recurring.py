from flask import Blueprint, jsonify
from app.models.expense import Expense
from app.utils.auth import token_required
from ml.recurring.detector import detect_recurring_expenses

recurring_bp = Blueprint('recurring', __name__, url_prefix='/api/recurring-expenses')

@recurring_bp.route('', methods=['GET'])
@token_required
def get_recurring_expenses(current_user):
    user_expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.date.asc()).all()
    expense_dicts = [e.to_dict() for e in user_expenses]

    recurring_data = detect_recurring_expenses(expense_dicts)

    return jsonify({
        'success': True,
        'data': recurring_data
    }), 200
