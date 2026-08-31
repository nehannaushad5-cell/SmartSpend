from flask import Blueprint, request, jsonify
from app.models.expense import Expense
from app.models.schema import SavingsGoal
from app.utils.auth import token_required
from app.services.simulator_service import run_what_if_simulation

simulator_bp = Blueprint('simulator', __name__, url_prefix='/api/what-if')

@simulator_bp.route('', methods=['POST'])
@token_required
def run_simulation_endpoint(current_user):
    data = request.get_json() or {}
    percentage_reductions = data.get('percentage_reductions', {})

    user_expenses = Expense.query.filter_by(user_id=current_user.id).all()
    user_goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()

    expense_dicts = [e.to_dict() for e in user_expenses]
    goal_dicts = [g.to_dict() for g in user_goals]

    simulation_result = run_what_if_simulation(
        expense_dicts,
        percentage_reductions,
        savings_goals=goal_dicts
    )

    return jsonify({
        'success': True,
        'simulation': simulation_result
    }), 200
