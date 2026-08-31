import io

def test_csv_import_success(client, auth_headers):
    csv_content = """Date,Description,Amount,Category,Payment Method
2026-08-25,Amazon Electronics,1299.50,Shopping,Credit Card
2026-08-26,Uber ride to airport,240.00,Transportation,UPI
2026-08-27,Swiggy dinner,450.00,,UPI
"""
    data = {
        'file': (io.BytesIO(csv_content.encode('utf-8')), 'test_expenses.csv')
    }
    res = client.post('/api/expenses/import', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data['success'] is True
    assert res_data['summary']['imported_count'] == 3
    assert res_data['summary']['auto_categorized_count'] == 1  # Swiggy dinner auto-categorized

def test_csv_import_duplicates(client, auth_headers):
    csv_content = """Date,Description,Amount,Category,Payment Method
2026-08-25,Amazon Electronics,1299.50,Shopping,Credit Card
2026-08-25,Amazon Electronics,1299.50,Shopping,Credit Card
"""
    data = {
        'file': (io.BytesIO(csv_content.encode('utf-8')), 'duplicates.csv')
    }
    res = client.post('/api/expenses/import', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data['summary']['imported_count'] == 1
    assert res_data['summary']['duplicate_count'] == 1

def test_csv_import_invalid_rows(client, auth_headers):
    csv_content = """Date,Description,Amount
INVALID_DATE,Myntra Clothes,1499.00
2026-08-29,Blinkit Groceries,INVALID_AMOUNT
2026-08-30,Apollo Pharmacy,420.00
"""
    data = {
        'file': (io.BytesIO(csv_content.encode('utf-8')), 'invalid_rows.csv')
    }
    res = client.post('/api/expenses/import', headers=auth_headers, data=data, content_type='multipart/form-data')
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data['summary']['imported_count'] == 1
    assert res_data['summary']['failed_count'] == 2
    assert len(res_data['failed_records']) == 2
