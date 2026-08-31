import io
from flask import Blueprint, request, jsonify, send_file
from app.utils.auth import token_required
from app.services.csv_service import process_csv_import

import_bp = Blueprint('import_csv', __name__, url_prefix='/api/expenses/import')

ALLOWED_EXTENSIONS = {'csv'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@import_bp.route('', methods=['POST'])
@token_required
def upload_csv(current_user):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No CSV file provided in request.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Invalid file format. Please upload a .csv file.'}), 400

    # Read stream to check size
    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({'success': False, 'message': 'File size exceeds maximum allowed limit of 5MB.'}), 400

    # Stream file to CSV service
    stream = io.StringIO(file_bytes.decode('utf-8', errors='ignore'))
    result = process_csv_import(stream, current_user.id)

    if not result.get('success'):
        return jsonify(result), 400

    return jsonify(result), 200
