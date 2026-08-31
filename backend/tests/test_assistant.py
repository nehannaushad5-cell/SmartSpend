from app.services.assistant_service import process_assistant_query

def test_assistant_category_query(app):
    with app.app_context():
        res = process_assistant_query(user_id=1, query_text="How much did I spend on Food this month?")
        assert res['intent'] == 'category_spending'
        assert 'Food & Dining' in res['reply']

def test_assistant_budget_query(app):
    with app.app_context():
        res = process_assistant_query(user_id=1, query_text="Am I on track with my budget?")
        assert res['intent'] == 'budget_risk'
        assert 'overspending risk' in res['reply']

def test_assistant_forecast_query(app):
    with app.app_context():
        res = process_assistant_query(user_id=1, query_text="What is my forecast for next month?")
        assert res['intent'] == 'forecast'
