from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
import mysql.connector
import json
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from typing import Tuple

# ------------------------------
# Helpers: Password hashing + safe check (migration-friendly)
# ------------------------------
def hash_password(password: str) -> str:
    """Return bcrypt hash (utf-8 string)."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def check_password_safe(plain: str, stored: str) -> Tuple[bool, bool]:
    """
    Safely compare a plain password with stored value.
    Returns (matches, was_plaintext).
    - matches: True if password matches (either bcrypt or plaintext)
    - was_plaintext: True if stored value looked like plaintext (fallback)
    """
    if stored is None:
        return False, False
    try:
        # stored expected to be bcrypt hash
        ok = bcrypt.checkpw(plain.encode('utf-8'), stored.encode('utf-8'))
        return ok, False
    except (ValueError, TypeError):
        # Invalid salt or non-bytes: fallback to plaintext compare
        return (plain == stored), True

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # JWT is expected in the Authorization header as Bearer token
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = data['id']

            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE id=%s", (user_id,))
            user = cursor.fetchone()
            cursor.close()
            conn.close()

            if not user:
                return jsonify({'message': 'User not found'}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'message': f'Token error: {str(e)}'}), 401

        return f(user, *args, **kwargs)

    return decorated

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
    MAIL_PASSWORD='Praveen@123',  # ⚠️ move to env vars in production
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
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        normalized = [perm.strip().lower() for perm in permissions_list]
        cursor.execute("DELETE FROM permissions WHERE user_id = %s", (user_id,))
        cursor.execute("INSERT INTO permissions (user_id, permissions) VALUES (%s, %s)",
                       (user_id, json.dumps(normalized)))
        conn.commit()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ------------------------------
# Add/Update Permissions
# ------------------------------
@app.route('/api/permissions', methods=['POST'])
def add_permissions():
    data = request.json or {}
    user_id = data.get('user_id')
    permissions = data.get('permissions', [])

    if not user_id or not isinstance(permissions, list):
        return jsonify({'success': False, 'message': 'Invalid data'}), 400

    try:
        save_permissions(user_id, permissions)
        return jsonify({'success': True, 'message': 'Permissions saved'}), 201
    except Exception as e:
        print("❌ Error saving permissions:", e)
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

    # Collect fields
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
    password = data.get('password')
    role = data.get('role')
    permissions = data.get('permissions', [])

    if email or password or role:
        if not all([email, password, role]):
            return jsonify({"error": "Email, password, and role are required if adding authentication"}), 400
        # Hash password before saving
        password = hash_password(password)
    else:
        email, password, role, permissions = None, None, None, []

    conn = None
    cursor = None
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
        print("❌ MySQL Error (create_user):", err)
        return jsonify({"error": str(err)}), 400
    except Exception as e:
        print("❌ Error (create_user):", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ------------------------------
# Get All Users
# ------------------------------
@app.route('/api/users', methods=['GET'])
@app.route('/get_users', methods=['GET'])  # Alias for Angular legacy call
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, phone, department, pan, address, country, state, city, zip,
                   bank_name, branch_name, account_no, ifsc_code, account_holder,
                   working_branch, wages, email, role
            FROM users
        """)
        users = cursor.fetchall()

        # Fetch permissions for all users in a single query
        cursor.execute("SELECT user_id, permissions FROM permissions")
        permissions_rows = cursor.fetchall()
        perms_map = {row['user_id']: json.loads(row['permissions']) for row in permissions_rows}

        for user in users:
            user['permissions'] = perms_map.get(user['id'], [])

        cursor.close()
        conn.close()
        return jsonify(users), 200

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# ------------------------------
# Get Single User
# ------------------------------
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        cursor.execute("SELECT permissions FROM permissions WHERE user_id=%s", (user_id,))
        row = cursor.fetchone()
        user['permissions'] = json.loads(row['permissions']) if row and row.get('permissions') else []
        user.pop('password', None)
        return jsonify(user)
    except Exception as e:
        print("Error fetching user:", e)
        return jsonify({"error": "Failed to fetch user"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ------------------------------
# Update User
# ------------------------------
@app.route('/api/update_user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    conn = None
    cursor = None
    try:
        data = request.json or {}
        name = data.get("name")
        email = data.get("email")
        role = data.get("role")
        phone = data.get("phone")
        permissions = data.get("permissions", [])

        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            UPDATE users
            SET name=%s, email=%s, role=%s, phone=%s
            WHERE id=%s
        """
        cursor.execute(query, (name, email, role, phone, user_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "User not found"}), 404

        # Save permissions using same connection
        save_permissions(user_id, permissions)

        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        print("❌ ERROR (update_user):", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ------------------------------
# Login with JWT (migration-friendly)
# ------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

        stored_pw = user.get('password')

        matches, was_plaintext = check_password_safe(password, stored_pw)
        if not matches:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

        # If the stored password was plaintext and matched, rehash & save it (migrate)
        if was_plaintext:
            try:
                new_hash = hash_password(password)
                upd = conn.cursor()
                upd.execute("UPDATE users SET password=%s WHERE id=%s", (new_hash, user['id']))
                conn.commit()
                upd.close()
                print(f"🔁 Migrated user id={user['id']} password to bcrypt hash.")
            except Exception as e:
                print("⚠️ Failed to migrate plaintext password to bcrypt:", e)

        # Load permissions
        cursor.execute("SELECT permissions FROM permissions WHERE user_id=%s", (user['id'],))
        row = cursor.fetchone()
        permissions = json.loads(row['permissions']) if row and row.get('permissions') else []
        # Remove password before using user object further
        user.pop('password', None)

        payload = {
            "id": user["id"],
            "email": user["email"],
            "role": user.get("role"),
            "permissions": permissions,
            "exp": datetime.utcnow() + timedelta(hours=12)
        }
        token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            "success": True,
            "token": token,
            "userId": user['id'],
            "role": user.get('role'),
            "name": user.get('name'),
            "email": user.get('email'),
            "permissions": permissions
        })
    except Exception as e:
        print("❌ ERROR (login):", e)
        return jsonify({"error": "Server error"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ------------------------------
# Forgot Password
# ------------------------------
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json or {}
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'message': 'No account found with that email'}), 404

        token = serializer.dumps(email, salt='reset-password')
        reset_link = f"http://localhost:4200/reset-password/{token}"

        msg = Message("Reset Your Password", recipients=[email])
        msg.body = f"Click here to reset your password:\n{reset_link}"
        mail.send(msg)

        return jsonify({'message': 'Reset email sent successfully'})

    except Exception as e:
        print("❌ ERROR (forgot-password):", e, type(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()



# ------------------------------
# Reset Password (hash new password)
# ------------------------------
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Authorization token required'}), 401

    try:
        decoded = jwt.decode(token.split(" ")[1], app.config['SECRET_KEY'], algorithms=['HS256'])
        user_email = decoded.get('email')
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    data = request.json or {}
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    if not current_password or not new_password:
        return jsonify({'message': 'Current and new passwords are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT password FROM users WHERE email=%s", (user_email,))
    user = cursor.fetchone()

    if not user:
        return jsonify({'message': 'User not found'}), 404

    # check old password
    matches, _ = check_password_safe(current_password, user['password'])
    if not matches:
        return jsonify({'message': 'Current password is incorrect'}), 401

    # update new password
    hashed_pw = hash_password(new_password)
    cursor.execute("UPDATE users SET password=%s WHERE email=%s", (hashed_pw, user_email))
    conn.commit()

    return jsonify({'message': 'Password reset successful'})




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
                   u.name AS user_name, u.department,
                   aa.assigned_date, aa.return_date, aa.status
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

        # 1️⃣ Update assignment table: mark as returned
        cursor.execute("""
            UPDATE asset_assignments 
            SET status='returned', return_date=NOW() 
            WHERE id=%s
        """, (assignment_id,))

        # 2️⃣ Get asset_id to update asset table
        cursor.execute("SELECT asset_id FROM asset_assignments WHERE id=%s", (assignment_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "Assignment not found"}), 404
        asset_id = result[0]

        # 3️⃣ Update asset table: set status to 'Available'
        cursor.execute("""
            UPDATE assets 
            SET status='Available'
            WHERE id=%s
        """, (asset_id,))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Asset returned successfully ✅"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500

# ------------------------------
# Run App
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True)
