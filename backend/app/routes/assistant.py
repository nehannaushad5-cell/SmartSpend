from flask import Blueprint, request, jsonify
from app.utils.auth import token_required
from app.services.assistant_service import process_assistant_query

assistant_bp = Blueprint('assistant', __name__, url_prefix='/api/assistant')

@assistant_bp.route('/chat', methods=['POST'])
@token_required
def chat_endpoint(current_user):
    data = request.get_json() or {}
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'success': False, 'message': 'Message text is required'}), 400

    result = process_assistant_query(current_user.id, message)

    return jsonify({
        'success': True,
        'reply': result['reply'],
        'intent': result['intent'],
        'data': result['data']
    }), 200
