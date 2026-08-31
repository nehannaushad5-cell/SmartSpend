from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models.schema import SavingsGoal
from app.models.expense import Expense
from app.db import db
from app.utils.auth import token_required

savings_bp = Blueprint('savings', __name__, url_prefix='/api/savings-goals')

def calculate_goal_telemetry(goal, user_expenses):
    """
    Computes required monthly savings, estimated completion date, and completion % for a goal.
    """
    g_dict = goal.to_dict()
    target = goal.target_amount
    current = goal.current_savings
    remaining = max(target - current, 0.0)
    pct = round((current / target * 100.0), 1) if target > 0 else 0.0

    today = datetime.utcnow().date()
    target_date = goal.target_date

    days_left = max((target_date - today).days, 1)
    months_left = max(days_left / 30.44, 0.1)

    req_monthly_savings = round(remaining / months_left, 2)

    # Estimate current monthly savings rate based on expenses
    if user_expenses:
        monthly_exp = sum(e.amount for e in user_expenses if e.date >= today.replace(day=1))
        # Assuming benchmark income = monthly_exp * 1.3
        est_monthly_savings_rate = max(monthly_exp * 0.3, 1000.0)
    else:
        est_monthly_savings_rate = 2000.0

    est_months_to_complete = remaining / est_monthly_savings_rate if est_monthly_savings_rate > 0 else 999
    est_completion_days = int(est_months_to_complete * 30.44)

    g_dict['remaining_amount'] = round(remaining, 2)
    g_dict['percentage_completed'] = pct
    g_dict['required_monthly_savings'] = req_monthly_savings
    g_dict['est_monthly_savings_rate'] = round(est_monthly_savings_rate, 2)
    g_dict['days_left'] = days_left

    return g_dict

@savings_bp.route('', methods=['GET'])
@token_required
def get_savings_goals(current_user):
    goals = SavingsGoal.query.filter_by(user_id=current_user.id).all()
    user_expenses = Expense.query.filter_by(user_id=current_user.id).all()

    goal_telemetry_list = [calculate_goal_telemetry(g, user_expenses) for g in goals]

    return jsonify({
        'success': True,
        'count': len(goals),
        'savings_goals': goal_telemetry_list
    }), 200

@savings_bp.route('', methods=['POST'])
@token_required
def create_savings_goal(current_user):
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    target_amount = data.get('target_amount')
    current_savings = data.get('current_savings', 0.0)
    target_date_str = data.get('target_date', '').strip()
    notes = data.get('notes', '').strip()

    if not name or target_amount is None or not target_date_str:
        return jsonify({'success': False, 'message': 'Goal name, target amount, and target date are required'}), 400

    try:
        target_amount = float(target_amount)
        current_savings = float(current_savings)
        if target_amount <= 0:
            return jsonify({'success': False, 'message': 'Target amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid numeric amount'}), 400

    try:
        target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid target date format. Expected YYYY-MM-DD'}), 400

    try:
        goal = SavingsGoal(
            user_id=current_user.id,
            name=name,
            target_amount=target_amount,
            current_savings=current_savings,
            target_date=target_date,
            notes=notes
        )
        db.session.add(goal)
        db.session.commit()

        user_expenses = Expense.query.filter_by(user_id=current_user.id).all()
        return jsonify({
            'success': True,
            'message': 'Savings goal created successfully',
            'savings_goal': calculate_goal_telemetry(goal, user_expenses)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to create savings goal: {str(e)}'}), 500

@savings_bp.route('/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_savings_goal(current_user, goal_id):
    goal = SavingsGoal.query.filter_by(id=goal_id, user_id=current_user.id).first()
    if not goal:
        return jsonify({'success': False, 'message': 'Savings goal not found'}), 404

    try:
        db.session.delete(goal)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Savings goal deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete goal: {str(e)}'}), 500
