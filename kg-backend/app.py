from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import mysql.connector

# --- Flask & Mail Setup ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='praveenkumarkanagalla@gmail.com',      
    MAIL_PASSWORD='Praveen@123', 
)
mail = Mail(app)
serializer = URLSafeTimedSerializer("PRA24@123ab")
# --- MySQL DB Connection ---
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="PRA24@123ab",
    database="kg_dashboard"
)
cursor = conn.cursor(dictionary=True)

# --- Token store (in-memory; use DB for production) ---
reset_tokens = {}

# ✅ LOGIN ROUTE
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (data['email'], data['password']))
    user = cursor.fetchone()

    if user:
        return jsonify({
            'token': 'token',
            'role': user['role'],
            'name': user['name'],
            'email': user['email']
        })
    return jsonify({'error': 'Invalid credentials'}), 401

# ✅ FORGOT PASSWORD - Send Email with Reset Link
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email is required'}), 400

        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'No account found with that email'}), 404

        # Create token
        token = serializer.dumps(email, salt='reset-password')
        reset_link = f"http://localhost:4200/reset-password/{token}"

        # Send email
        msg = Message("Reset Your Password", recipients=[email])
        msg.body = f"Click here to reset your password:\n{reset_link}"
        mail.send(msg)

        return jsonify({'message': 'Reset email sent successfully'})

    except Exception as e:
        print("🔥 Error in forgot-password route:", e)
        return jsonify({'message': 'Server error occurred'}), 500


# ✅ RESET PASSWORD USING TOKEN
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    try:
        email = serializer.loads(token, salt='reset-password', max_age=3600)  # 1 hour
    except:
        return jsonify({'message': 'Invalid or expired token.'}), 400

    # Update password in DB
    cursor.execute("UPDATE users SET password = %s WHERE email = %s", (new_password, email))
    conn.commit()

    # Remove used token
    reset_tokens.pop(token, None)

    return jsonify({'message': 'Password reset successful.'})

# ✅ ALERT EMAIL FUNCTION
def send_alert(subject, message, recipient):
    msg = Message(subject, recipients=[recipient])
    msg.body = message
    mail.send(msg)


# Run Flask App
if __name__ == '__main__':
    app.run(debug=True)
