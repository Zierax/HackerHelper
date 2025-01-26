import json
import threading
import logging
from typing import Any, Dict, Optional
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance = None
    _lock = threading.Lock()
    _file_lock = threading.Lock()
    
    def __new__(cls) -> 'DatabaseManager':
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self) -> None:
        if self._initialized:
            return
            
        self.db_path = Path("db.json")
        self.backup_path = Path("db.backup.json")
        self.data: Dict[str, Any] = {}
        self._initialized = True
        self._load_data()
        
    @contextmanager
    def _atomic_write(self):
        """Ensure atomic write operations with backup."""
        with self._file_lock:
            try:
                # Create backup before modification
                if self.db_path.exists():
                    import shutil
                    shutil.copy2(self.db_path, self.backup_path)
                
                yield
                
                # If successful, remove backup
                if self.backup_path.exists():
                    self.backup_path.unlink()
            except Exception as e:
                # Restore from backup if write failed
                if self.backup_path.exists():
                    self.backup_path.replace(self.db_path)
                logger.error(f"Database write error: {str(e)}")
                raise
    
    def _load_data(self) -> None:
        """Load data from the database file with recovery."""
        try:
            if not self.db_path.exists():
                if self.backup_path.exists():
                    logger.warning("Main database not found, recovering from backup")
                    self.backup_path.replace(self.db_path)
                else:
                    self._create_default_db()
                    return
                    
            with self._file_lock:
                with open(self.db_path, 'r') as f:
                    self.data = json.load(f)
                    
        except json.JSONDecodeError as e:
            logger.error(f"Database corruption detected: {str(e)}")
            if self.backup_path.exists():
                logger.info("Attempting recovery from backup")
                self.backup_path.replace(self.db_path)
                self._load_data()  # Recursive call to try loading from backup
            else:
                logger.error("No backup available, creating new database")
                self._create_default_db()
        except Exception as e:
            logger.error(f"Error loading database: {str(e)}")
            self._create_default_db()
    
    def _create_default_db(self) -> None:
        """Create default database structure."""
        self.data = {
            "vulnerability": {
                "xss": [], "csrf": [], "clickjacking": [],
                "sql-injection": [], "ssl-tls": []
            },
            "network": {
                "http-enum": [], "ssl-enum": [], "dns-brute": [],
                "nmap-scan": [], "smb-enum": [], "mysql-enum": []
            },
            "encryption": {
                "generate-key-pair-ecdsa": [], "sign-ecdsa": [],
                "verify-ecdsa": [], "encrypt-file": [], "decrypt-file": [],
                "generate-key-pair-ecdh": [], "generate-hmac": [],
                "verify-hmac": [], "generate-totp": [], "verify-totp": []
            },
            "recon": {
                "whois": [], "shodan": [], "censys": [],
                "google-dork": [], "technology": [], "email-harvest": [],
                "domain-info": [], "ssl-info": [], "subdomain-enum": []
            }
        }
        self.save()
    
    def save(self) -> None:
        """Save data to database with atomic write."""
        with self._atomic_write():
            with open(self.db_path, 'w') as f:
                json.dump(self.data, f, indent=2)
                
    def get(self, key: str, default: Any = None) -> Any:
        """Thread-safe get operation."""
        with self._lock:
            return self.data.get(key, default)
            
    def set(self, key: str, value: Any) -> None:
        """Thread-safe set operation with automatic save."""
        with self._lock:
            self.data[key] = value
            self.save()
            
    def update(self, key: str, value: Any) -> None:
        """Thread-safe update operation."""
        with self._lock:
            if key in self.data:
                if isinstance(self.data[key], dict) and isinstance(value, dict):
                    self.data[key].update(value)
                else:
                    self.data[key] = value
                self.save()
            else:
                raise KeyError(f"Key '{key}' not found in database")

db = DatabaseManager()
