from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import mysql.connector
import json
import jwt
import datetime
from datetime import datetime, timedelta

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
# Create New User
# ------------------------------
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json(silent=True)
    print("Payload received:", data)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    # Collect basic fields
    name = data.get('name')
    phone = data.get('phone')
    department = data.get('department')
    pan = data.get('pan')
    address = data.get('address')
    country = data.get('country')
    state = data.get('state')
    city = data.get('city')
    zip_code = data.get('zip')
    bank_name = data.get('bank_name')
    branch_name = data.get('branch_name')
    account_no = data.get('account_no')
    ifsc_code = data.get('ifsc_code')
    account_holder = data.get('account_holder')
    working_branch = data.get('working_branch')
    wages = data.get('wages')

    # Optional authentication fields
    email = data.get('email')
    password = data.get('password')  # plain password
    role = data.get('role')
    permissions = data.get('permissions', [])

    # Validate auth fields if any provided
    if email or password or role:
        if not all([email, password, role]):
            return jsonify({"error": "Email, password, and role are required if adding authentication"}), 400
    else:
        email = None
        password = None
        role = None
        permissions = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users
            (name, phone, department, pan, address, country, state, city, zip,
             bank_name, branch_name, account_no, ifsc_code, account_holder, 
             working_branch, wages, email, password, role)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s)
        """, (
            name, phone, department, pan, address, country, state, city, zip_code,
            bank_name, branch_name, account_no, ifsc_code, account_holder,
            working_branch, wages, email, password, role
        ))
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
            "role": role,
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
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(users)
    except Exception as e:
        print("Error fetching users:", e)
        return jsonify({"error": "Failed to fetch users"}), 500

# ------------------------------
# Get Single User
# ------------------------------
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user:
            return jsonify(user)
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print("Error fetching user:", e)
        return jsonify({"error": "Failed to fetch user"}), 500
    
@app.route('/update_user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.json
        print("📌 Incoming data:", data)   # Debug print

        name = data.get("name")
        email = data.get("email")
        role = data.get("role")
        phone = data.get("phone")
        permissions = data.get("permissions", [])

        print("📌 Permissions before processing:", permissions)

        if isinstance(permissions, str):
            permissions = [p.strip() for p in permissions.split(",") if p.strip()]

        permissions_str = ",".join(permissions)
        print("📌 Permissions final string:", permissions_str)

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            UPDATE users 
            SET name=%s, email=%s, role=%s, phone=%s, permissions=%s 
            WHERE id=%s
        """
        cursor.execute(query, (name, email, role, phone, permissions_str, user_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        print("❌ ERROR:", str(e))   # Log actual error
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ------------------------------
# Login with JWT (plain password)
# ------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check user credentials
    cursor.execute(
        "SELECT * FROM users WHERE email=%s AND password=%s",
        (data['email'], data['password'])
    )
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    # Get user permissions
    cursor.execute("SELECT permissions FROM permissions WHERE user_id=%s", (user['id'],))
    row = cursor.fetchone()
    permissions = json.loads(row['permissions']) if row else []

    conn.close()

    # JWT payload
    payload = {
        "id": user["id"],
        'user_id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'permissions': permissions,
         "exp": datetime.utcnow() + timedelta(hours=12)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        'success': True,
        'token': token,
        'userId': user['id'],
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
# Reset Password (plain)
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

    return jsonify({'message': 'Password reset successful.'})   




@app.route('/save-report', methods=['POST'])
def save_report():
    try:
        data = request.get_json()
        print("📥 Received Payload:", data)

        # ✅ Convert ISO date to MySQL-friendly format
        today_str = data.get('today')
        if today_str:
            today = datetime.fromisoformat(today_str.replace("Z", ""))  # remove Z
            today_sql = today.strftime("%Y-%m-%d %H:%M:%S")  # works for DATETIME
        else:
            today_sql = None

        conn = get_db_connection()
        cursor = conn.cursor()

        # Example: insert into reports table
        sql = """
        INSERT INTO reports 
        (today, opening_balance, gross_actual, gross_system, gross_difference,
         swipe_actual, swipe_system, swipe_diff, upi_actual, upi_system, upi_diff,
         cash_actual, cash_system, cash_diff, total_actual, total_system, total_diff,
         amount_deposit, closing_balance, monthly_sale, total_expense)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        values = (
            today_sql,  # ✅ cleaned date
            data['opening_balance'], data['gross_actual'], data['gross_system'], data['gross_difference'],
            data['swipe_actual'], data['swipe_system'], data['swipe_diff'],
            data['upi_actual'], data['upi_system'], data['upi_diff'],
            data['cash_actual'], data['cash_system'], data['cash_diff'],
            data['total_actual'], data['total_system'], data['total_diff'],
            data['amount_deposit'], data['closing_balance'], data['monthly_sale'],
            data['total_expense']
        )

        cursor.execute(sql, values)
        report_id = cursor.lastrowid

        # ✅ Save denominations
        for d in data['denominations']:
            cursor.execute(
                "INSERT INTO denominations (report_id, note, quantity, total) VALUES (%s,%s,%s,%s)",
                (report_id, d['note'], d['quantity'], d['total'])
            )

        # ✅ Save expenses
        for e in data['expenses']:
            cursor.execute(
                "INSERT INTO expenses (report_id, name, amount) VALUES (%s,%s,%s)",
                (report_id, e['name'], e['amount'])
            )

        conn.commit()
        cursor.close()
        return jsonify({"message": "Report saved ✅"}), 201

    except Exception as e:
        print("❌ Error saving report:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/get-monthly-sale/<string:month>', methods=['GET'])
def get_monthly_sale(month):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # month format = "2025-08" (YYYY-MM)
        query = """
            SELECT IFNULL(SUM(gross_actual), 0) as monthly_sale
            FROM reports
            WHERE DATE_FORMAT(today, '%Y-%m') = %s
        """
        cursor.execute(query, (month,))
        result = cursor.fetchone()
        cursor.close()

        return jsonify({"monthly_sale": float(result["monthly_sale"])})
    except Exception as e:
        print("❌ Error fetching monthly sale:", e)
        return jsonify({"error": str(e)}), 500
    

# Get all assets
@app.route("/assets", methods=["GET"])
def get_assets():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM assets")
        assets = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(assets)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Add new asset
@app.route("/assets", methods=["POST"])
def add_asset():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO assets (asset_tag, type, brand, model, serial_number, status) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (
            data["asset_tag"],
            data["type"],
            data["brand"],
            data["model"],
            data["serial_number"],
            "Available"
        )
        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Asset added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Update asset
@app.route('/assets/<int:asset_id>', methods=['PUT'])
def update_asset(asset_id):
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if asset exists
        cursor.execute("SELECT id FROM assets WHERE id=%s", (asset_id,))
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Asset not found"}), 404

        query = """
            UPDATE assets
            SET asset_tag=%s, type=%s, brand=%s, model=%s, serial_number=%s, status=%s
            WHERE id=%s
        """
        values = (
            data.get("asset_tag"),
            data.get("type"),
            data.get("brand"),
            data.get("model"),
            data.get("serial_number"),
            data.get("status", "Available"),
            asset_id
        )
        cursor.execute(query, values)
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"message": "Asset updated successfully"}), 200

    except Exception as e:
        print("❌ Error updating asset:", e)
        return jsonify({"error": str(e)}), 500


# Delete asset
@app.route('/assets/<int:asset_id>', methods=['DELETE'])
def delete_asset(asset_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if asset exists
        cursor.execute("SELECT id FROM assets WHERE id=%s", (asset_id,))
        existing = cursor.fetchone()
        if not existing:
            cursor.close()
            conn.close()
            return jsonify({"error": "Asset not found"}), 404

        cursor.execute("DELETE FROM assets WHERE id=%s", (asset_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"message": "Asset deleted successfully"}), 200

    except Exception as e:
        print("❌ Error deleting asset:", e)
        return jsonify({"error": str(e)}), 500


# ------------------------------
# Assign Asset to User
# ------------------------------
@app.route("/assign_asset_to_user", methods=["POST"])
def assign_asset_to_user():
    try:
        data = request.json
        user_id = data.get("user_id")
        asset_id = data.get("asset_id")

        if not user_id or not asset_id:
            return jsonify({"error": "user_id and asset_id are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if asset exists and is available
        cursor.execute("SELECT status FROM assets WHERE id=%s", (asset_id,))
        asset = cursor.fetchone()
        if not asset:
            cursor.close()
            conn.close()
            return jsonify({"error": "Asset not found"}), 404
        if asset[0] == "Assigned":
            cursor.close()
            conn.close()
            return jsonify({"error": "Asset already assigned"}), 400

        # Insert into assignments table
        cursor.execute(
            "INSERT INTO asset_assignments (asset_id, user_id) VALUES (%s, %s)",
            (asset_id, user_id)
        )

        # Update asset status
        cursor.execute(
            "UPDATE assets SET status='Assigned' WHERE id=%s",
            (asset_id,)
        )

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Asset assigned successfully ✅"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------------------
# Get All Assigned Assets
# ------------------------------
@app.route("/assigned_assets", methods=["GET"])
def get_assigned_assets():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT aa.id, a.asset_tag, a.type, a.brand, a.model,
                   u.name AS user_name, u.department, aa.assigned_date, aa.status
            FROM asset_assignments aa
            JOIN assets a ON aa.asset_id = a.id
            JOIN users u ON aa.user_id = u.id
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------------------
# Return Asset
# ------------------------------
@app.route("/return_asset/<int:assignment_id>", methods=["PUT"])
def return_asset(assignment_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update assignment status
        cursor.execute("""
            UPDATE asset_assignments 
            SET status='returned', return_date=NOW() 
            WHERE id=%s
        """, (assignment_id,))

        # Get asset_id to update asset table
        cursor.execute("SELECT asset_id FROM asset_assignments WHERE id=%s", (assignment_id,))
        asset_id = cursor.fetchone()[0]

        # Update asset status
        cursor.execute("UPDATE assets SET status='Available' WHERE id=%s", (asset_id,))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Asset returned successfully ✅"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ------------------------------
# Run App
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True)
