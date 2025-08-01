from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

conn = mysql.connector.connect(
    host="localhost", 
    user="root", 
    password="PRA24@123ab", 
    database="kg_dashboard"
)
cursor = conn.cursor(dictionary=True)

# login data
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    cursor.execute(
        "SELECT * FROM users WHERE email=%s AND password=%s",
        (data['email'], data['password'])
    )
    user = cursor.fetchone()
    if user:
        return jsonify({'token': 'token', 'role': user['role'], 'name': user['name'], 'email': user['email']})
    return jsonify({'error': 'Invalid credentials'}), 401

        
if __name__ == '__main__':
    app.run(debug=True)
