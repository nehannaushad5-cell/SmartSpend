from flask import Blueprint, request, jsonify
from app.models.expense import Expense
from app.models.schema import Anomaly
from app.db import db
from app.utils.auth import token_required
from ml.anomaly_detection.predict import detect_transaction_anomalies

anomalies_bp = Blueprint('anomalies', __name__, url_prefix='/api/anomalies')

@anomalies_bp.route('', methods=['GET'])
@token_required
def get_anomalies(current_user):
    user_expenses = Expense.query.filter_by(user_id=current_user.id).all()
    expense_dicts = [e.to_dict() for e in user_expenses]

    # Run Isolation Forest anomaly detection
    detected = detect_transaction_anomalies(expense_dicts)

    # Sync with DB Anomaly status table
    existing_anomalies = Anomaly.query.filter_by(user_id=current_user.id).all()
    anomaly_status_map = {a.expense_id: a.status for a in existing_anomalies}

    for item in detected:
        exp_id = item.get('expense_id')
        if exp_id in anomaly_status_map:
            item['status'] = anomaly_status_map[exp_id]
        else:
            item['status'] = 'Pending'

    return jsonify({
        'success': True,
        'count': len(detected),
        'anomalies': detected
    }), 200

@anomalies_bp.route('/<int:expense_id>/status', methods=['PUT'])
@token_required
def update_anomaly_status(current_user, expense_id):
    data = request.get_json() or {}
    new_status = data.get('status', 'Expected').strip()

    if new_status not in ['Pending', 'Expected', 'Unexpected']:
        return jsonify({'success': False, 'message': 'Status must be Pending, Expected, or Unexpected'}), 400

    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return jsonify({'success': False, 'message': 'Expense not found'}), 404

    anomaly = Anomaly.query.filter_by(user_id=current_user.id, expense_id=expense_id).first()
    if not anomaly:
        anomaly = Anomaly(
            user_id=current_user.id,
            expense_id=expense_id,
            anomaly_score=-0.2,
            reason='User reviewed anomaly',
            status=new_status
        )
        db.session.add(anomaly)
    else:
        anomaly.status = new_status

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Anomaly status updated to {new_status}',
            'anomaly': anomaly.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update status: {str(e)}'}), 500
