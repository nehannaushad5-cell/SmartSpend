from datetime import datetime
from app.db import db

CATEGORIES = [
    'Food & Dining',
    'Groceries',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Rent',
    'Subscriptions',
    'Other'
]

PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'Net Banking', 'Other']

class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    predicted_category = db.Column(db.String(50), nullable=True)
    category_confidence = db.Column(db.Float, nullable=True)
    payment_method = db.Column(db.String(50), default='UPI', nullable=False)
    notes = db.Column(db.Text, nullable=True)
    is_user_corrected = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'amount': self.amount,
            'description': self.description,
            'date': self.date.strftime('%Y-%m-%d') if self.date else None,
            'category': self.category,
            'predicted_category': self.predicted_category,
            'category_confidence': round(self.category_confidence, 2) if self.category_confidence is not None else None,
            'payment_method': self.payment_method,
            'notes': self.notes or '',
            'is_user_corrected': self.is_user_corrected,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
