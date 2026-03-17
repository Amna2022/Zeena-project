from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
from routes import api

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # allow requests from frontend
    CORS(app)

    db.init_app(app)

    app.register_blueprint(api, url_prefix="/api")

    return app


app = create_app()

if __name__ == "__main__":
    print("Starting Zeena backend...")
    app.run(debug=True)