from functools import wraps
from flask import request, jsonify
import time
import jwt
import os
from typing import Dict, Callable, Any
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_WINDOWS = {
    'default': {'window': 60, 'max_requests': 100},  # 100 requests per minute
    'vulnerability': {'window': 60, 'max_requests': 30},  # 30 requests per minute
    'network': {'window': 60, 'max_requests': 20},  # 20 requests per minute
    'recon': {'window': 60, 'max_requests': 50}  # 50 requests per minute
}

# Store request counts: {ip: {endpoint: [(timestamp, count)]}}
request_history: Dict[str, Dict[str, list]] = {}

def clean_old_requests():
    """Remove requests older than the rate limit window"""
    current_time = time.time()
    for ip in list(request_history.keys()):
        for endpoint in list(request_history[ip].keys()):
            window = RATE_LIMIT_WINDOWS.get(endpoint, RATE_LIMIT_WINDOWS['default'])['window']
            request_history[ip][endpoint] = [
                (ts, count) for ts, count in request_history[ip][endpoint]
                if current_time - ts < window
            ]

def is_rate_limited(ip: str, endpoint: str) -> bool:
    """Check if the request should be rate limited"""
    if ip not in request_history:
        request_history[ip] = {}
    if endpoint not in request_history[ip]:
        request_history[ip][endpoint] = []

    clean_old_requests()
    
    current_time = time.time()
    window_config = RATE_LIMIT_WINDOWS.get(endpoint, RATE_LIMIT_WINDOWS['default'])
    window = window_config['window']
    max_requests = window_config['max_requests']

    # Count requests in current window
    requests_in_window = sum(
        count for ts, count in request_history[ip][endpoint]
        if current_time - ts < window
    )

    if requests_in_window >= max_requests:
        return True

    # Add current request
    request_history[ip][endpoint].append((current_time, 1))
    return False

def require_api_key(f: Callable) -> Callable:
    """Decorator to require and validate API keys for specific endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        endpoint = request.endpoint or 'unknown'
        
        # Check if endpoint requires API key
        if any(service in endpoint for service in ['shodan', 'censys']):
            if 'shodan' in endpoint:
                api_key = request.headers.get('X-Shodan-API-Key')
                if not api_key:
                    return jsonify({'error': 'Shodan API key is required'}), 401
            elif 'censys' in endpoint:
                api_id = request.headers.get('X-Censys-API-ID')
                api_secret = request.headers.get('X-Censys-API-Secret')
                if not api_id or not api_secret:
                    return jsonify({'error': 'Censys API credentials are required'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def validate_input(required_params: list = None, optional_params: list = None):
    """Decorator to validate request parameters"""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400

            # Validate required parameters
            if required_params:
                missing_params = [param for param in required_params if param not in data]
                if missing_params:
                    return jsonify({
                        'error': f'Missing required parameters: {", ".join(missing_params)}'
                    }), 400

            # Remove any parameters that aren't in required or optional lists
            allowed_params = (required_params or []) + (optional_params or [])
            unknown_params = [param for param in data if param not in allowed_params]
            if unknown_params:
                return jsonify({
                    'error': f'Unknown parameters: {", ".join(unknown_params)}'
                }), 400

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def rate_limit(f: Callable) -> Callable:
    """Decorator to apply rate limiting"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = request.remote_addr
        endpoint = request.endpoint or 'default'
        
        if is_rate_limited(ip, endpoint):
            return jsonify({
                'error': 'Rate limit exceeded. Please try again later.',
                'retry_after': RATE_LIMIT_WINDOWS.get(endpoint, RATE_LIMIT_WINDOWS['default'])['window']
            }), 429
        
        return f(*args, **kwargs)
    return decorated_function

def error_handler(f: Callable) -> Callable:
    """Decorator to handle errors and provide consistent error responses"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {f.__name__}: {str(e)}", exc_info=True)
            return jsonify({
                'error': 'An internal server error occurred',
                'message': str(e) if os.getenv('DEBUG') == 'true' else None
            }), 500
    return decorated_function

def log_request(f: Callable) -> Callable:
    """Decorator to log request details"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        response = f(*args, **kwargs)
        duration = time.time() - start_time
        
        logger.info(
            f"Request: {request.method} {request.path} | "
            f"IP: {request.remote_addr} | "
            f"Duration: {duration:.2f}s | "
            f"Status: {response[1] if isinstance(response, tuple) else 200}"
        )
        
        return response
    return decorated_function
