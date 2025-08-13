from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import mysql.connector
import json
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# ------------------------------
# Flask Setup
# ------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

app.config.update(
    SECRET_KEY='PRA24@123ab',
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='praveenkumarkanagalla@gmail.com',
    MAIL_PASSWORD='Praveen@123',  # ⚠️ Store securely in env variables
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
# Helper: Save Permissions
# ------------------------------
def save_permissions(user_id, permissions_list):
    """Store all permissions as JSON in a single row"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Normalize
    normalized = [perm.strip().lower() for perm in permissions_list]

    # Delete old row
    cursor.execute("DELETE FROM permissions WHERE user_id = %s", (user_id,))
    # Insert new row
    cursor.execute(
        "INSERT INTO permissions (user_id, permissions) VALUES (%s, %s)",
        (user_id, json.dumps(normalized))
    )

    conn.commit()
    cursor.close()
    conn.close()

# ------------------------------
# Create New User
# ------------------------------
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone', '')
    role = data.get('role', '')
    blood_group = data.get('blood_group', '')
    address = data.get('address', '')
    permissions = data.get('permissions', [])  # optional permissions array

    if not (name and email and password and blood_group):
        return jsonify({"error": "name, email, password and blood_group are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, email, password, phone, role, blood_group, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, email, password, phone, role, blood_group, address))
        conn.commit()
        inserted_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # Save permissions if provided
        if permissions:
            save_permissions(inserted_id, permissions)

        return jsonify({
            "id": inserted_id,
            "name": name,
            "email": email,
            "phone": phone,
            "role": role,
            "blood_group": blood_group,
            "address": address,
            "permissions": permissions
        }), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

# ------------------------------
# Get Users
# ------------------------------
@app.route('/get_users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, email, phone, role, blood_group, address FROM users ORDER BY id DESC")
        users = cursor.fetchall()

        for user in users:
            cursor.execute("SELECT permissions FROM permissions WHERE user_id=%s", (user['id'],))
            row = cursor.fetchone()
            user['permissions'] = json.loads(row['permissions']) if row else []

        cursor.close()
        conn.close()
        return jsonify(users)

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# ------------------------------
# Add/Update Permissions
# ------------------------------
@app.route('/api/permissions', methods=['POST'])
def add_permissions():
    data = request.json
    user_id = data.get('user_id')
    permissions = data.get('permissions', [])

    if not user_id or not isinstance(permissions, list):
        return jsonify({'success': False, 'message': 'Invalid data'}), 400

    try:
        save_permissions(user_id, permissions)
        return jsonify({'success': True, 'message': 'Permissions saved'}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ------------------------------
# Login with JWT
# ------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email=%s AND password=%s",
        (data['email'], data['password'])
    )
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    cursor.execute("SELECT permissions FROM permissions WHERE user_id=%s", (user['id'],))
    row = cursor.fetchone()
    permissions = json.loads(row['permissions']) if row else []

    conn.close()

    payload = {
        'user_id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'permissions': permissions,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'success': True,
        'token': token,
        'role': user['role'],
        'name': user['name'],
        'email': user['email'],
        'permissions': permissions
    })

# ------------------------------
# Forgot Password
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
# Reset Password
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
    password = generate_password_hash(new_password)
    cursor.execute("UPDATE users SET password=%s WHERE email=%s", (password, email))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Password reset successful.'})

# ------------------------------
# Run App
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True)
