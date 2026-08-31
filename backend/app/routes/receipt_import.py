from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.services.receipt_service import scan_receipt_image

receipt_bp = Blueprint('receipt_import', __name__, url_prefix='/api/expenses')

@receipt_bp.route('/scan-receipt', methods=['POST'])
@token_required
def scan_receipt_endpoint(current_user):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No image file uploaded'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400

    allowed_exts = {'png', 'jpg', 'jpeg', 'webp', 'bmp', 'pdf'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_exts:
        return jsonify({'success': False, 'message': 'Unsupported file format. Please upload JPG, PNG, WEBP or PDF.'}), 400

    try:
        image_bytes = file.read()
        extracted = scan_receipt_image(image_bytes)

        return jsonify({
            'success': True,
            'message': 'Receipt scanned successfully',
            'receipt': extracted
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to process receipt image: {str(e)}'}), 500
