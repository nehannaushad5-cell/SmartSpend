def test_register_success(client):
    res = client.post('/api/auth/register', json={
        'name': 'Alice Smith',
        'email': 'alice@example.com',
        'password': 'securepassword',
        'currency': '$'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert 'token' in data
    assert data['user']['email'] == 'alice@example.com'

def test_register_duplicate_email(client):
    client.post('/api/auth/register', json={
        'name': 'Bob',
        'email': 'bob@example.com',
        'password': 'password123'
    })
    res = client.post('/api/auth/register', json={
        'name': 'Bob Duplicate',
        'email': 'bob@example.com',
        'password': 'password123'
    })
    assert res.status_code == 409
    assert res.get_json()['success'] is False

def test_login_success(client):
    client.post('/api/auth/register', json={
        'name': 'Charlie',
        'email': 'charlie@example.com',
        'password': 'password123'
    })
    res = client.post('/api/auth/login', json={
        'email': 'charlie@example.com',
        'password': 'password123'
    })
    assert res.status_code == 200
    assert res.get_json()['success'] is True
    assert 'token' in res.get_json()

def test_login_invalid_password(client):
    client.post('/api/auth/register', json={
        'name': 'David',
        'email': 'david@example.com',
        'password': 'correctpassword'
    })
    res = client.post('/api/auth/login', json={
        'email': 'david@example.com',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401

def test_get_me_protected(client, auth_headers):
    res = client.get('/api/auth/me', headers=auth_headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['user']['email'] == 'test@example.com'

def test_get_me_unauthorized(client):
    res = client.get('/api/auth/me')
    assert res.status_code == 401
