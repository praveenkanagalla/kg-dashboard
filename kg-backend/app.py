from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import mysql.connector
import json
import jwt
import datetime

# ------------------------------
# Flask & Mail Setup
# ------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config.update(
    SECRET_KEY='PRA24@123ab',  # required for JWT
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='praveenkumarkanagalla@gmail.com',
    MAIL_PASSWORD='Praveen@123',  # ⚠️ use an app password in production
)

mail = Mail(app)
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# ------------------------------
# MySQL Connection
# ------------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="PRA24@123ab",
        database="kg_dashboard"
    )

# ------------------------------
# Token store (in-memory, for dev)
# ------------------------------
reset_tokens = {}

# ------------------------------
# Create New User
# ------------------------------
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO users (name, email, password, phone, role, permissions)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (
        data['name'],
        data['email'],
        data['password'],
        data['phone'],
        data['role'],
        json.dumps(data.get('permissions', []))
    ))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'message': 'User created successfully'})

# ------------------------------
# Login with JWT token
# ------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (data['email'], data['password']))
    user = cursor.fetchone()
    conn.close()

    if user:
        user['permissions'] = json.loads(user['permissions']) if user['permissions'] else []

        payload = {
            'user_id': user['id'],
            'email': user['email'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
        }
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'success': True,
            'token': token,
            'role': user['role'],
            'name': user['name'],
            'email': user['email'],
            'permissions': user['permissions']
        })
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# ------------------------------
# Forgot password
# ------------------------------
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        return jsonify({'message': 'No account found with that email'}), 404

    token = serializer.dumps(email, salt='reset-password')
    reset_link = f"http://localhost:4200/reset-password/{token}"

    msg = Message("Reset Your Password", recipients=[email])
    msg.body = f"Click here to reset your password:\n{reset_link}"
    mail.send(msg)

    return jsonify({'message': 'Reset email sent successfully'})

# ------------------------------
# Reset password using token
# ------------------------------
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    try:
        email = serializer.loads(token, salt='reset-password', max_age=3600)
    except:
        return jsonify({'message': 'Invalid or expired token.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password=%s WHERE email=%s", (new_password, email))
    conn.commit()
    conn.close()

    reset_tokens.pop(token, None)

    return jsonify({'message': 'Password reset successful.'})

# ------------------------------
# Optional alert email
# ------------------------------
def send_alert(subject, message, recipient):
    msg = Message(subject, recipients=[recipient])
    msg.body = message
    mail.send(msg)

# ------------------------------
# Run the app
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True)
