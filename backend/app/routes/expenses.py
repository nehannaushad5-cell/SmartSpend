from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from app.db import db
from app.models.expense import Expense, CATEGORIES, PAYMENT_METHODS
from app.utils.auth import token_required

expenses_bp = Blueprint('expenses', __name__, url_prefix='/api/expenses')

# Simple rule-based prediction helper until ML model is trained in Phase 3
RULE_CATEGORY_KEYWORDS = {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'dinner', 'lunch', 'breakfast', 'pizza', 'burger', 'kfc', 'mcdonalds', 'starbucks', 'food', 'bakery', 'tea', 'coffee'],
    'Groceries': ['supermarket', 'mart', 'grocery', 'bigbasket', 'blinkit', 'zepto', 'd-mart', 'dmart', 'vegetables', 'fruits', 'milk', 'store'],
    'Transportation': ['uber', 'ola', 'rapido', 'cab', 'auto', 'metro', 'fuel', 'petrol', 'diesel', 'bus', 'train', 'flight', 'parking', 'toll'],
    'Bills & Utilities': ['electricity', 'water', 'gas', 'broadband', 'wifi', 'recharge', 'mobile bill', 'power', 'bescom', 'cesc', 'utility'],
    'Entertainment': ['cinema', 'movie', 'bookmyshow', 'pvr', 'inox', 'game', 'gaming', 'concert', 'event', 'club'],
    'Healthcare': ['pharmacy', 'hospital', 'doctor', 'apollo', 'medplus', 'clinic', 'medicine', 'lab test', 'health', 'dental'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'clothes', 'shoes', 'electronics', 'mall', 'fashion'],
    'Education': ['udemy', 'coursera', 'books', 'school', 'college', 'tuition', 'fee', 'course', 'stationery'],
    'Travel': ['hotel', 'airbnb', 'make my trip', 'makemytrip', 'booking.com', 'resort', 'vacation', 'trip'],
    'Rent': ['rent', 'house rent', 'flat rent', 'maintenance'],
    'Subscriptions': ['netflix', 'spotify', 'prime', 'youtube', 'github', 'apple', 'hotstar', 'disney', 'chatgpt']
}

def fallback_predict_category(description):
    """Predict category based on keywords with a mock confidence score."""
    if not description:
        return 'Other', 0.5
    desc_lower = description.lower()
    for cat, keywords in RULE_CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in desc_lower:
                return cat, 0.88
    return 'Other', 0.5

@expenses_bp.route('/categories', methods=['GET'])
def get_categories():
    return jsonify({
        'success': True,
        'categories': CATEGORIES,
        'payment_methods': PAYMENT_METHODS
    }), 200

@expenses_bp.route('/predict-category', methods=['POST'])
def predict_category_endpoint():
    data = request.get_json() or {}
    description = data.get('description', '')
    
    # Try importing ML prediction model if exists, otherwise fallback
    try:
        from ml.categorization.predict import predict_expense_category
        predicted_cat, conf = predict_expense_category(description)
    except Exception:
        predicted_cat, conf = fallback_predict_category(description)
        
    return jsonify({
        'success': True,
        'predicted_category': predicted_cat,
        'confidence': round(conf, 2)
    }), 200

@expenses_bp.route('', methods=['GET'])
@token_required
def get_expenses(current_user):
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    sort_by = request.args.get('sort_by', 'date_desc')

    query = Expense.query.filter_by(user_id=current_user.id)

    if search:
        query = query.filter(or_(
            Expense.description.ilike(f'%{search}%'),
            Expense.notes.ilike(f'%{search}%')
        ))

    if category and category != 'All':
        query = query.filter(Expense.category == category)

    if start_date:
        try:
            s_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Expense.date >= s_date)
        except ValueError:
            pass

    if end_date:
        try:
            e_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Expense.date <= e_date)
        except ValueError:
            pass

    if sort_by == 'date_asc':
        query = query.order_by(Expense.date.asc(), Expense.id.asc())
    elif sort_by == 'amount_desc':
        query = query.order_by(Expense.amount.desc())
    elif sort_by == 'amount_asc':
        query = query.order_by(Expense.amount.asc())
    else:
        query = query.order_by(Expense.date.desc(), Expense.id.desc())

    expenses = query.all()

    # Calculate summary metrics for current query scope
    total_amount = sum(e.amount for e in expenses)

    return jsonify({
        'success': True,
        'count': len(expenses),
        'total_amount': round(total_amount, 2),
        'expenses': [e.to_dict() for e in expenses]
    }), 200

@expenses_bp.route('', methods=['POST'])
@token_required
def create_expense(current_user):
    data = request.get_json() or {}

    amount = data.get('amount')
    description = data.get('description', '').strip()
    date_str = data.get('date', '').strip()
    category = data.get('category', '').strip()
    payment_method = data.get('payment_method', 'UPI').strip()
    notes = data.get('notes', '').strip()

    if amount is None or not description or not date_str:
        return jsonify({'success': False, 'message': 'Amount, description, and date are required'}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'success': False, 'message': 'Amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid amount format'}), 400

    try:
        expense_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format. Expected YYYY-MM-DD'}), 400

    # Auto category prediction if omitted or set to Auto
    predicted_cat, confidence = fallback_predict_category(description)
    is_user_corrected = False

    if not category or category == 'Auto':
        category = predicted_cat
    else:
        if category != predicted_cat:
            is_user_corrected = True

    try:
        expense = Expense(
            user_id=current_user.id,
            amount=amount,
            description=description,
            date=expense_date,
            category=category,
            predicted_category=predicted_cat,
            category_confidence=confidence,
            payment_method=payment_method if payment_method in PAYMENT_METHODS else 'UPI',
            notes=notes,
            is_user_corrected=is_user_corrected
        )

        db.session.add(expense)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Expense created successfully',
            'expense': expense.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to save expense: {str(e)}'}), 500

@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
@token_required
def update_expense(current_user, expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return jsonify({'success': False, 'message': 'Expense not found'}), 404

    data = request.get_json() or {}

    if 'amount' in data:
        try:
            amt = float(data['amount'])
            if amt <= 0:
                return jsonify({'success': False, 'message': 'Amount must be greater than 0'}), 400
            expense.amount = amt
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Invalid amount format'}), 400

    if 'description' in data:
        desc = data['description'].strip()
        if not desc:
            return jsonify({'success': False, 'message': 'Description cannot be empty'}), 400
        expense.description = desc

    if 'date' in data:
        try:
            expense.date = datetime.strptime(data['date'].strip(), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid date format. Expected YYYY-MM-DD'}), 400

    if 'category' in data:
        new_cat = data['category'].strip()
        if new_cat and new_cat != expense.category:
            if new_cat != expense.predicted_category:
                expense.is_user_corrected = True
            expense.category = new_cat

    if 'payment_method' in data:
        pm = data['payment_method'].strip()
        if pm in PAYMENT_METHODS:
            expense.payment_method = pm

    if 'notes' in data:
        expense.notes = data['notes'].strip()

    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Expense updated successfully',
            'expense': expense.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update expense: {str(e)}'}), 500

@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@token_required
def delete_expense(current_user, expense_id):
    expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
    if not expense:
        return jsonify({'success': False, 'message': 'Expense not found'}), 404

    try:
        db.session.delete(expense)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete expense: {str(e)}'}), 500
