import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from app.db import db

def create_app(config_class=Config):
    dist_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/dist'))
    flask_app = Flask(__name__, static_folder=dist_folder, static_url_path='')
    flask_app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(flask_app)
    CORS(flask_app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.expenses import expenses_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.import_csv import import_bp
    from app.routes.forecast import forecast_bp
    from app.routes.risk import risk_bp
    from app.routes.anomalies import anomalies_bp
    from app.routes.recurring import recurring_bp
    from app.routes.budgets import budgets_bp
    from app.routes.savings import savings_bp
    from app.routes.simulator import simulator_bp
    from app.routes.assistant import assistant_bp
    from app.routes.receipt_import import receipt_bp

    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(expenses_bp)
    flask_app.register_blueprint(dashboard_bp)
    flask_app.register_blueprint(import_bp)
    flask_app.register_blueprint(forecast_bp)
    flask_app.register_blueprint(risk_bp)
    flask_app.register_blueprint(anomalies_bp)
    flask_app.register_blueprint(recurring_bp)
    flask_app.register_blueprint(budgets_bp)
    flask_app.register_blueprint(savings_bp)
    flask_app.register_blueprint(simulator_bp)
    flask_app.register_blueprint(assistant_bp)
    flask_app.register_blueprint(receipt_bp)

    @flask_app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'service': 'SmartSpend API', 'version': '1.0.0'}), 200

    @flask_app.route('/', defaults={'path': ''})
    @flask_app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({'error': 'API endpoint not found'}), 404
        target_path = os.path.join(flask_app.static_folder, path)
        if path != "" and os.path.isfile(target_path):
            return send_from_directory(flask_app.static_folder, path)
        return send_from_directory(flask_app.static_folder, 'index.html')

    @flask_app.errorhandler(404)
    def handle_404(e):
        from flask import request
        if request.path.startswith('/api/'):
            return jsonify({'error': 'API endpoint not found'}), 404
        return send_from_directory(flask_app.static_folder, 'index.html')

    # Ensure database tables exist
    with flask_app.app_context():
        import app.models  # load models
        db.create_all()

    return flask_app
