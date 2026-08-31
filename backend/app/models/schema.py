from datetime import datetime
from app.db import db

class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False) # 'Overall' or specific category name
    amount = db.Column(db.Float, nullable=False)
    month = db.Column(db.String(7), nullable=False) # e.g. "2026-08"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category,
            'amount': self.amount,
            'month': self.month,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SavingsGoal(db.Model):
    __tablename__ = 'savings_goals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    target_amount = db.Column(db.Float, nullable=False)
    current_savings = db.Column(db.Float, default=0.0, nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'target_amount': self.target_amount,
            'current_savings': self.current_savings,
            'target_date': self.target_date.strftime('%Y-%m-%d') if self.target_date else None,
            'notes': self.notes or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class RecurringExpense(db.Model):
    __tablename__ = 'recurring_expenses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(20), default='Monthly', nullable=False) # Monthly, Weekly, Yearly
    estimated_day_of_month = db.Column(db.Integer, nullable=True)
    last_detected = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'amount': self.amount,
            'category': self.category,
            'frequency': self.frequency,
            'estimated_day_of_month': self.estimated_day_of_month,
            'last_detected': self.last_detected.strftime('%Y-%m-%d') if self.last_detected else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Anomaly(db.Model):
    __tablename__ = 'anomalies'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    expense_id = db.Column(db.Integer, db.ForeignKey('expenses.id', ondelete='CASCADE'), nullable=False)
    anomaly_score = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='Pending', nullable=False) # 'Pending', 'Expected', 'Unexpected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    expense = db.relationship('Expense', backref='anomaly_records')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'expense_id': self.expense_id,
            'anomaly_score': self.anomaly_score,
            'reason': self.reason,
            'status': self.status,
            'expense': self.expense.to_dict() if self.expense else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ModelMetadata(db.Model):
    __tablename__ = 'model_metadata'

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(50), nullable=False, unique=True)
    version = db.Column(db.String(20), nullable=False)
    metrics = db.Column(db.Text, nullable=True) # JSON string of metrics
    last_trained = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'model_name': self.model_name,
            'version': self.version,
            'metrics': self.metrics,
            'last_trained': self.last_trained.isoformat() if self.last_trained else None
        }
