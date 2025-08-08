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
    MAIL_PASSWORD='Praveen@123',  # ⚠️ Consider storing this securely in environment variables
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
    permissions = data.get('permissions', [])  # expected array

    if not (name and email and password):
        return jsonify({"error": "name, email and password are required"}), 400


    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        permissions_json = json.dumps(permissions)  # store as JSON string
        cursor.execute("""
            INSERT INTO users (name, email, password, phone, role, permissions)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, email, password, phone, role, permissions_json))
        conn.commit()
        inserted_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # return created user (without password) — return permissions as array
        return jsonify({
            "id": inserted_id,
            "name": name,
            "email": email,
            "phone": phone,
            "role": role,
            "permissions": permissions
        }), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@app.route('/get_users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email, phone, role, permissions FROM users ORDER BY id DESC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        users = []
        for r in rows:
            perms = r.get('permissions')
            try:
                # if stored as JSON string, parse to list; if already list, use it
                parsed = json.loads(perms) if isinstance(perms, str) and perms else (perms if isinstance(perms, list) else [])
            except Exception:
                parsed = []
            users.append({
                "id": r.get('id'),
                "name": r.get('name'),
                "email": r.get('email'),
                "phone": r.get('phone'),
                "role": r.get('role'),
                "permissions": parsed
            })

        return jsonify(users)

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# ------------------------------
# Login with JWT Token
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
        user['permissions'] = [row[0] for row in cursor.fetchall()]
        

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
# Run the App
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True)
