from flask import Blueprint, jsonify
from app.models.expense import Expense
from app.utils.auth import token_required
from ml.forecasting.predict import forecast_user_spending

forecast_bp = Blueprint('forecast', __name__, url_prefix='/api/forecast')

@forecast_bp.route('', methods=['GET'])
@token_required
def get_expense_forecast(current_user):
    user_expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.date.asc()).all()

    expense_dicts = [e.to_dict() for e in user_expenses]
    result = forecast_user_spending(expense_dicts, days_ahead=30)

    return jsonify({
        'success': True,
        'forecast': result
    }), 200
