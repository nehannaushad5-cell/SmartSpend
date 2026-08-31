def test_create_expense_manual(client, auth_headers):
    res = client.post('/api/expenses', headers=auth_headers, json={
        'amount': 450.0,
        'description': 'Swiggy dinner',
        'date': '2026-08-30',
        'category': 'Food & Dining',
        'payment_method': 'UPI',
        'notes': 'Dinner with friends'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['expense']['amount'] == 450.0
    assert data['expense']['category'] == 'Food & Dining'

def test_create_expense_auto_category(client, auth_headers):
    res = client.post('/api/expenses', headers=auth_headers, json={
        'amount': 240.0,
        'description': 'Uber ride to station',
        'date': '2026-08-29',
        'category': 'Auto',
        'payment_method': 'UPI'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['expense']['category'] == 'Transportation'

def test_get_expenses(client, auth_headers):
    # Add two expenses
    client.post('/api/expenses', headers=auth_headers, json={
        'amount': 100.0, 'description': 'Item 1', 'date': '2026-08-28', 'category': 'Groceries'
    })
    client.post('/api/expenses', headers=auth_headers, json={
        'amount': 200.0, 'description': 'Item 2', 'date': '2026-08-29', 'category': 'Shopping'
    })

    res = client.get('/api/expenses', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['count'] == 2
    assert data['total_amount'] == 300.0

def test_update_expense(client, auth_headers):
    create_res = client.post('/api/expenses', headers=auth_headers, json={
        'amount': 500.0, 'description': 'Initial desc', 'date': '2026-08-28', 'category': 'Other'
    })
    exp_id = create_res.get_json()['expense']['id']

    update_res = client.put(f'/api/expenses/{exp_id}', headers=auth_headers, json={
        'amount': 600.0,
        'category': 'Shopping'
    })
    assert update_res.status_code == 200
    assert update_res.get_json()['expense']['amount'] == 600.0
    assert update_res.get_json()['expense']['category'] == 'Shopping'

def test_delete_expense(client, auth_headers):
    create_res = client.post('/api/expenses', headers=auth_headers, json={
        'amount': 150.0, 'description': 'To delete', 'date': '2026-08-28', 'category': 'Other'
    })
    exp_id = create_res.get_json()['expense']['id']

    del_res = client.delete(f'/api/expenses/{exp_id}', headers=auth_headers)
    assert del_res.status_code == 200

    get_res = client.get('/api/expenses', headers=auth_headers)
    assert get_res.get_json()['count'] == 0

def test_user_expense_isolation(client):
    # User 1
    u1_reg = client.post('/api/auth/register', json={'name': 'User1', 'email': 'u1@ex.com', 'password': 'password123'})
    t1 = u1_reg.get_json()['token']

    # User 2
    u2_reg = client.post('/api/auth/register', json={'name': 'User2', 'email': 'u2@ex.com', 'password': 'password123'})
    t2 = u2_reg.get_json()['token']

    # User 1 creates expense
    client.post('/api/expenses', headers={'Authorization': f'Bearer {t1}'}, json={
        'amount': 999.0, 'description': 'Private U1 expense', 'date': '2026-08-28', 'category': 'Shopping'
    })

    # User 2 checks expenses
    res2 = client.get('/api/expenses', headers={'Authorization': f'Bearer {t2}'})
    assert res2.get_json()['count'] == 0
