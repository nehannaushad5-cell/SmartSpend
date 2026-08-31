from app.services.receipt_service import parse_receipt_text, scan_receipt_image

def test_parse_receipt_text():
    sample_text = """
    STARBUCKS STORE #104
    123 MAIN STREET
    Date: 2026-08-30
    
    1 GRANDE LATTE    450.00
    1 BLUEBERRY MUFFIN 250.00
    
    TOTAL: 700.00
    THANK YOU FOR VISITING!
    """
    res = parse_receipt_text(sample_text)
    assert res['amount'] == 700.0
    assert 'STARBUCKS' in res['description']
    assert res['date'] == '2026-08-30'

def test_scan_receipt_image_fallback():
    res = scan_receipt_image(b'fake_image_bytes')
    assert 'amount' in res
    assert 'category' in res
