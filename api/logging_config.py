import logging
import logging.handlers
import os
from datetime import datetime
from typing import Dict, Any

def setup_logging(app_name: str = "hacker_helper", log_level: str = "INFO") -> None:
    """Setup logging configuration."""
    
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Generate log filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d")
    log_file = os.path.join(log_dir, f"{app_name}_{timestamp}.log")
    
    # Basic configuration
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            },
            "simple": {
                "format": "%(levelname)s - %(message)s"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "DEBUG",
                "formatter": "simple",
                "stream": "ext://sys.stdout"
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "verbose",
                "filename": log_file,
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "verbose",
                "filename": os.path.join(log_dir, f"{app_name}_error_{timestamp}.log"),
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5
            }
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["console", "file", "error_file"],
                "level": log_level,
                "propagate": True
            },
            "werkzeug": {  # Flask's built-in server
                "handlers": ["console", "file"],
                "level": "INFO",
                "propagate": False
            },
            "security": {  # Security-related logs
                "handlers": ["console", "file", "error_file"],
                "level": "INFO",
                "propagate": False
            }
        }
    }
    
    # Apply configuration
    logging.config.dictConfig(logging_config)
    
    # Create logger instance
    logger = logging.getLogger(__name__)
    logger.info(f"Logging setup completed. Log file: {log_file}")
    
    return logger

def get_security_logger() -> logging.Logger:
    """Get security-specific logger."""
    return logging.getLogger("security")

def log_security_event(event_type: str, details: Dict[str, Any]) -> None:
    """Log security-related events."""
    security_logger = get_security_logger()
    security_logger.info(f"Security Event - Type: {event_type}, Details: {details}")

def log_api_request(method: str, endpoint: str, ip: str, status: int) -> None:
    """Log API requests."""
    logger = logging.getLogger("api")
    logger.info(f"API Request - Method: {method}, Endpoint: {endpoint}, IP: {ip}, Status: {status}")

def log_error(error: Exception, context: Dict[str, Any] = None) -> None:
    """Log errors with context."""
    logger = logging.getLogger(__name__)
    error_details = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context or {}
    }
    logger.error(f"Error occurred: {error_details}", exc_info=True)
