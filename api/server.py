from flask import *
import json
import uuid
import asyncio
from datetime import datetime
import signal
import sys
import os
import bs4 as bs4
import socket
import platform
from core import reconnaissance, network, vulnerability, ai_assistant, encryption, shell_manager
from flask_cors import cross_origin
from middleware import require_api_key, validate_input, rate_limit, error_handler, log_request

assistant = ai_assistant.AIAssistant()
shell_manager = shell_manager.ShellManager()
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-here')

@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def init_db():
    try:
        with open('db.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        
        data = {
            "vulnerability": {
                "xss": [],
                "csrf": [],
                "clickjacking": [],
                "sql-injection": [],
                "ssl-tls": []
            },
            "network": {
                "http-enum": [],
                "ssl-enum": [],
                "dns-brute": [],
                "nmap-scan": [],
                "smb-enum": [],
                "mysql-enum": []
            },
            "encryption": {
                "generate-key-pair-ecdsa": [],
                "sign-ecdsa": [],
                "verify-ecdsa": [],
                "encrypt-file": [],
                "decrypt-file": [],
                "generate-key-pair-ecdh": [],
                "generate-hmac": [],
                "verify-hmac": [],
                "generate-totp": [],
                "verify-totp": []
            },
            "recon": {
                "whois": [],
                "shodan": [],
                "censys": [],
                "google-dork": [],
                "technology-detection": [],
                "email-harvest": [],
                "domain-info": [],
                "ssl-info": [],
                "subdomain-enum": [],
                "cve-search": []
            }
        }

    with open('db.json', 'w') as f:
        json.dump(data, f, indent=4)

def read_db():
    with open('db.json', 'r') as f:
        return json.load(f)

def write_db(data):
    with open('db.json', 'w') as f:
        json.dump(data, f, indent=4)

def signal_handler(sig, frame):
    print('\033[94mYou pressed Ctrl+C!\033[0m')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

# Vulnerability Endpoints
@app.route('/api/v1/vulnerability/xss', methods=['POST'])
@log_request
@error_handler
@rate_limit
@validate_input(required_params=['url'])
def vulnerability_xss():
    data = request.get_json()
    url = data.get('url')
    result = vulnerability.xss_check(url)
    db = read_db()
    db['vulnerability']['xss'].append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "url": url,
        "result": result
    })
    write_db(db)
    return jsonify({"message": "XSS check successful", "result": result}), 201

@app.route('/api/v1/vulnerability/sql-injection', methods=['POST'])
@log_request
@error_handler
@rate_limit
@validate_input(required_params=['url', 'parameters'])
def vulnerability_sql_injection():
    data = request.get_json()
    result = vulnerability.sql_injection_check(data['url'], data['parameters'])
    db = read_db()
    db['vulnerability']['sql-injection'].append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "url": data['url'],
        "parameters": data['parameters'],
        "result": result
    })
    write_db(db)
    return jsonify({"message": "SQL Injection check successful", "result": result}), 201

# Network Endpoints
@app.route('/api/v1/network/nmap-scan', methods=['POST'])
@log_request
@error_handler
@rate_limit
@validate_input(required_params=['target'], optional_params=['ports', 'arguments'])
def network_nmap_scan():
    data = request.get_json()
    result = network.nmap_scan(
        target=data['target'],
        ports=data.get('ports'),
        arguments=data.get('arguments')
    )
    db = read_db()
    db['network']['nmap-scan'].append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "target": data['target'],
        "ports": data.get('ports'),
        "arguments": data.get('arguments'),
        "result": result
    })
    write_db(db)
    return jsonify({"message": "Nmap Scan successful", "result": result}), 201

# Recon Endpoints
@app.route('/api/v1/recon/shodan', methods=['POST'])
@log_request
@error_handler
@rate_limit
@require_api_key
@validate_input(required_params=['query'])
def recon_shodan():
    data = request.get_json()
    api_key = request.headers.get('X-Shodan-API-Key')
    result = reconnaissance.comprehensive_shodan_search(data['query'], api_key)
    db = read_db()
    db['recon']['shodan'].append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "query": data['query'],
        "result": result
    })
    write_db(db)
    return jsonify({"message": "Shodan Search successful", "result": result}), 201

@app.route('/api/v1/recon/censys', methods=['POST'])
@log_request
@error_handler
@rate_limit
@require_api_key
@validate_input(required_params=['query'])
def recon_censys():
    data = request.get_json()
    api_id = request.headers.get('X-Censys-API-ID')
    api_secret = request.headers.get('X-Censys-API-Secret')
    result = reconnaissance.multi_source_censys_search(
        data['query'],
        api_id=api_id,
        api_secret=api_secret
    )
    db = read_db()
    db['recon']['censys'].append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "query": data['query'],
        "result": result
    })
    write_db(db)
    return jsonify({"message": "Censys Search successful", "result": result}), 201

@app.route('/api/v1/recon/google-dork', methods=['POST'])
@log_request
@error_handler
@rate_limit
@validate_input(required_params=['domain', 'dork'])
def recon_google_dork():
    data = request.get_json()
    result = reconnaissance.advanced_google_dork_search(
        data['domain'],
        data['dork']
    )
    db = read_db()
    db['recon']['google-dork'].append({
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "domain": data['domain'],
        "dork": data['dork'],
        "result": result
    })
    write_db(db)
    return jsonify({"message": "Google Dork Search successful", "result": result}), 201

# AI Assistant Endpoints
@app.route('/api/providers', methods=['GET'])
@log_request
@error_handler
def get_providers():
    try:
        providers = assistant.get_available_providers()
        return jsonify({
            'success': True,
            'providers': providers
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chat', methods=['POST'])
@log_request
@error_handler
@rate_limit
@validate_input(required_params=['provider', 'message'])
async def chat():
    data = request.get_json()
    provider = data.get('provider')
    message = data.get('message')
    
    try:
        response = await assistant.chat(provider, message)
        return jsonify({
            'success': True,
            'response': response
        })
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error Handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad Request', 'message': str(error)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found', 'message': 'The requested resource was not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method Not Allowed', 'message': 'The method is not allowed for the requested URL'}), 405

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({'error': 'Internal Server Error', 'message': 'An internal server error occurred'}), 500

if __name__ == '__main__':
    init_db()
    port = 3001
    host = '127.0.0.1'  # Only allow local connections
    
    print(f'\033[94mStarting HackerHelper API Server on port {port}\033[0m')
    print(f'\033[94mAPI Documentation available at http://{host}:{port}/docs\033[0m')
    
    app.run(
        host=host,
        port=port,
        debug=True,
        use_reloader=False
    )