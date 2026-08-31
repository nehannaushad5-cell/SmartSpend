from flask import Blueprint, request, jsonify
from app.db import db
from app.models.user import User
from app.utils.auth import generate_token, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    currency = data.get('currency', '₹').strip()
    
    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'Name, email, and password are required'}), 400
        
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long'}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'Email address is already registered'}), 409

    try:
        user = User(name=name, email=email, currency=currency)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        token = generate_token(user.id)
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'token': token,
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
    token = generate_token(user.id)
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'success': True,
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/reset-db-clear-all', methods=['POST', 'GET'])
def reset_db_clear_all():
    try:
        from app.models.expense import Expense
        from app.models.schema import Budget, SavingsGoal, RecurringExpense, Anomaly, ModelMetadata
        db.session.query(Anomaly).delete()
        db.session.query(RecurringExpense).delete()
        db.session.query(SavingsGoal).delete()
        db.session.query(Budget).delete()
        db.session.query(Expense).delete()
        db.session.query(ModelMetadata).delete()
        db.session.query(User).delete()
        db.session.commit()
        return jsonify({'success': True, 'message': 'All registered user emails and data erased successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
