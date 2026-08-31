from app.services.recommendations_service import generate_budget_recommendations
from app.services.simulator_service import run_what_if_simulation

def test_budget_recommendations():
    expenses = [
        {'amount': 500.0, 'category': 'Food & Dining', 'date': '2026-08-01'},
        {'amount': 600.0, 'category': 'Food & Dining', 'date': '2026-08-10'},
        {'amount': 700.0, 'category': 'Food & Dining', 'date': '2026-08-20'},
        {'amount': 1200.0, 'category': 'Shopping', 'date': '2026-08-15'}
    ]
    res = generate_budget_recommendations(expenses)
    assert 'recommendations' in res
    assert 'disclaimer' in res
    assert len(res['recommendations']) >= 2

def test_what_if_simulator():
    expenses = [
        {'amount': 1000.0, 'category': 'Food & Dining', 'date': '2026-08-01'},
        {'amount': 1000.0, 'category': 'Shopping', 'date': '2026-08-01'}
    ]
    percentage_reductions = {
        'Food & Dining': 20.0,  # Save 200/mo
        'Shopping': 10.0        # Save 100/mo
    }
    goals = [{'name': 'New Car', 'target_amount': 50000.0, 'current_savings': 10000.0}]

    sim = run_what_if_simulation(expenses, percentage_reductions, savings_goals=goals)
    assert sim['monthly_savings'] == 300.0
    assert sim['annual_savings'] == 3600.0
    assert len(sim['goal_impacts']) == 1
