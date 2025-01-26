import requests
import whois
import os
import bs4
import urllib.parse
import shodan
import googlesearch
import json
import concurrent.futures
import dotenv
import time
import logging
import censys
import builtwith
import cryptography.fernet
from cryptography.fernet import Fernet
import ssl
import socket
import dns.resolver
import random
from fake_useragent import UserAgent
import hunter
import re
import smtplib
import subprocess
import asyncio
import sublist3r
import requests_html
import passivetotal
import virustotal_python
import spyse

# Set up logging with more detailed formatting
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

dotenv_path = os.path.join(os.path.dirname(__file__), '../../.env')
dotenv.load_dotenv(dotenv_path)

# Securely store API keys
def encrypt_api_key(api_key):
    if not api_key:
        return None, None
    key = Fernet.generate_key()
    f = Fernet(key)
    return f.encrypt(api_key.encode()).decode(), key

def decrypt_api_key(encrypted_key, key):
    if not encrypted_key or not key:
        return None
    f = Fernet(key)
    return f.decrypt(encrypted_key.encode()).decode()

# Initialize API keys with error handling
def init_api_key(env_var):
    api_key = os.getenv(env_var)
    if not api_key:
        logger.warning(f"{env_var} not found in environment variables")
        return None, None
    return encrypt_api_key(api_key)

class ReconScanner:
    def __init__(self):
        self._setup_logging()
        self._init_api_keys()
        self._init_rate_limits()
        self.results_cache = {}
        self.cache_timeout = 3600  # 1 hour

    def _setup_logging(self):
        """Set up logging configuration."""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

    def _init_api_keys(self):
        """Initialize and validate API keys."""
        self.api_keys = {}
        self.key_status = {}
        
        # List of required API keys
        required_keys = [
            'SHODAN_API_KEY',
            'CENSYS_API_ID',
            'CENSYS_API_SECRET',
            'VIRUSTOTAL_API_KEY',
            'HUNTER_API_KEY'
        ]
        
        for key_name in required_keys:
            encrypted_key, key_cipher = init_api_key(key_name)
            if encrypted_key and key_cipher:
                self.api_keys[key_name] = {
                    'encrypted': encrypted_key,
                    'cipher': key_cipher
                }
                self.key_status[key_name] = True
            else:
                self.key_status[key_name] = False
                self.logger.warning(f"{key_name} not configured")

    def _init_rate_limits(self):
        """Initialize rate limiting configuration."""
        self.rate_limits = {
            'shodan': {'calls': 0, 'reset_time': time.time(), 'limit': 100, 'window': 3600},
            'censys': {'calls': 0, 'reset_time': time.time(), 'limit': 50, 'window': 3600},
            'virustotal': {'calls': 0, 'reset_time': time.time(), 'limit': 500, 'window': 86400},
            'hunter': {'calls': 0, 'reset_time': time.time(), 'limit': 100, 'window': 3600}
        }

    def _check_rate_limit(self, service: str) -> bool:
        """Check if service is currently rate limited."""
        if service not in self.rate_limits:
            return False

        current_time = time.time()
        rate_info = self.rate_limits[service]

        # Reset counter if window has passed
        if current_time - rate_info['reset_time'] >= rate_info['window']:
            rate_info['calls'] = 0
            rate_info['reset_time'] = current_time
            return False

        # Check if limit reached
        if rate_info['calls'] >= rate_info['limit']:
            return True

        rate_info['calls'] += 1
        return False

    def _get_api_key(self, key_name: str) -> Optional[str]:
        """Safely retrieve and decrypt API key."""
        if key_name not in self.api_keys:
            return None

        key_info = self.api_keys[key_name]
        try:
            return decrypt_api_key(key_info['encrypted'], key_info['cipher'])
        except Exception as e:
            self.logger.error(f"Failed to decrypt {key_name}: {e}")
            return None

    def _cache_result(self, cache_key: str, result: Dict[str, Any]):
        """Cache reconnaissance result."""
        self.results_cache[cache_key] = {
            'timestamp': time.time(),
            'data': result
        }

    def _get_cached_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached result if available and not expired."""
        if cache_key in self.results_cache:
            result = self.results_cache[cache_key]
            if time.time() - result['timestamp'] < self.cache_timeout:
                return result['data']
            del self.results_cache[cache_key]
        return None

    async def perform_recon(self, target: str, recon_types: List[str]) -> Dict[str, Any]:
        """Perform reconnaissance with multiple sources."""
        results = {
            'target': target,
            'timestamp': datetime.utcnow().isoformat(),
            'sources': {}
        }

        tasks = []
        for recon_type in recon_types:
            if hasattr(self, f"_recon_{recon_type}"):
                tasks.append(
                    asyncio.create_task(
                        getattr(self, f"_recon_{recon_type}")(target)
                    )
                )

        recon_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for recon_type, result in zip(recon_types, recon_results):
            if isinstance(result, Exception):
                results['sources'][recon_type] = {
                    'status': 'error',
                    'error': str(result)
                }
            else:
                results['sources'][recon_type] = {
                    'status': 'success',
                    'data': result
                }

        return results

    async def _recon_shodan(self, target: str) -> Dict[str, Any]:
        """Perform Shodan reconnaissance."""
        if self._check_rate_limit('shodan'):
            raise ValueError("Shodan rate limit exceeded")

        api_key = self._get_api_key('SHODAN_API_KEY')
        if not api_key:
            raise ValueError("Shodan API key not configured")

        try:
            api = shodan.Shodan(api_key)
            results = await asyncio.to_thread(api.host, target)
            return self._parse_shodan_results(results)
        except Exception as e:
            self.logger.error(f"Shodan scan failed: {str(e)}")
            raise

    async def _recon_censys(self, target: str) -> Dict[str, Any]:
        """Perform Censys reconnaissance."""
        if self._check_rate_limit('censys'):
            raise ValueError("Censys rate limit exceeded")

        api_id = self._get_api_key('CENSYS_API_ID')
        api_secret = self._get_api_key('CENSYS_API_SECRET')
        if not api_id or not api_secret:
            raise ValueError("Censys API credentials not configured")

        try:
            c = censys.search.CensysHosts(api_id=api_id, api_secret=api_secret)
            results = await asyncio.to_thread(c.search, target)
            return self._parse_censys_results(results)
        except Exception as e:
            self.logger.error(f"Censys scan failed: {str(e)}")
            raise

    def _parse_shodan_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and format Shodan results."""
        return {
            'ip': results.get('ip_str'),
            'hostnames': results.get('hostnames', []),
            'domains': results.get('domains', []),
            'ports': results.get('ports', []),
            'vulns': results.get('vulns', []),
            'tags': results.get('tags', []),
            'services': [
                {
                    'port': service.get('port'),
                    'protocol': service.get('transport', ''),
                    'service': service.get('product', ''),
                    'version': service.get('version', ''),
                    'cpe': service.get('cpe', []),
                    'banner': service.get('data', '')
                }
                for service in results.get('data', [])
            ]
        }

    def _parse_censys_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Parse and format Censys results."""
        parsed = {
            'services': [],
            'certificates': [],
            'location': {}
        }

        if 'hits' in results and results['hits']:
            hit = results['hits'][0]
            parsed.update({
                'ip': hit.get('ip'),
                'services': [
                    {
                        'port': service.get('port'),
                        'service_name': service.get('service_name'),
                        'transport_protocol': service.get('transport_protocol')
                    }
                    for service in hit.get('services', [])
                ],
                'location': hit.get('location', {}),
                'autonomous_system': hit.get('autonomous_system', {})
            })

        return parsed

def advanced_whois_lookup(domain):
    """Perform an advanced WHOIS lookup with error handling, rate limiting, and multiple providers."""
    whois_results = {}
    providers = [whois, whoxy.Whoxy(decrypt_api_key(WHOXY_API_KEY, whoxy_key)), passivetotal.WhoisRequest(decrypt_api_key(PASSIVETOTAL_API_KEY, passivetotal_key))]
    
    for provider in providers:
        try:
            if isinstance(provider, whois.WhoisQuery):
                whois_info = provider.query(domain)
            elif isinstance(provider, whoxy.Whoxy):
                whois_info = provider.whois_lookup(domain)
            elif isinstance(provider, passivetotal.WhoisRequest):
                whois_info = provider.get_whois(query=domain)
            
            whois_results[provider.__class__.__name__] = whois_info
            logger.info(f"WHOIS lookup for {domain} successful using {provider.__class__.__name__}.")
            time.sleep(1)  # Rate limiting
        except Exception as e:
            logger.error(f"WHOIS lookup failed for {domain} using {provider.__class__.__name__}: {e}")
    
    return whois_results

def comprehensive_shodan_search(query):
    """Perform a comprehensive Shodan search with decryption of API key and advanced features."""
    try:
        if not SHODAN_API_KEY or not shodan_key:
            logger.error("Shodan API key not configured")
            return {
                "error": "Shodan API key not configured. Please add SHODAN_API_KEY to your environment variables.",
                "status": "error"
            }

        api_key = decrypt_api_key(SHODAN_API_KEY, shodan_key)
        if not api_key:
            logger.error("Failed to decrypt Shodan API key")
            return {
                "error": "Failed to decrypt Shodan API key",
                "status": "error"
            }

        api = shodan.Shodan(api_key)
        
        try:
            # Perform the search
            results = api.search(query)
            
            # Process and format the results
            formatted_results = {
                "total": results['total'],
                "matches": [],
                "status": "success"
            }
            
            for match in results['matches']:
                formatted_match = {
                    "ip": match.get('ip_str'),
                    "port": match.get('port'),
                    "org": match.get('org'),
                    "hostnames": match.get('hostnames', []),
                    "location": {
                        "country": match.get('location', {}).get('country_name'),
                        "city": match.get('location', {}).get('city'),
                        "coordinates": [
                            match.get('location', {}).get('longitude'),
                            match.get('location', {}).get('latitude')
                        ]
                    },
                    "timestamp": match.get('timestamp'),
                    "data": match.get('data', '')[:1000]  # Limit data length
                }
                formatted_results["matches"].append(formatted_match)
            
            return formatted_results
            
        except shodan.APIError as e:
            logger.error(f"Shodan API error: {str(e)}")
            return {
                "error": f"Shodan API error: {str(e)}",
                "status": "error"
            }
            
    except Exception as e:
        logger.error(f"Unexpected error in Shodan search: {str(e)}")
        return {
            "error": f"Unexpected error: {str(e)}",
            "status": "error"
        }

def multi_source_censys_search(query):
    """Perform a multi-source Censys search with decryption of API keys."""
    try:
        censys_api = censys.search.CensysHosts(
            api_id=decrypt_api_key(CENSYS_API_ID, censys_id_key),
            api_secret=decrypt_api_key(CENSYS_API_SECRET, censys_secret_key)
        )
        hosts_results = list(censys_api.search(query, per_page=100))
        
        certificates_api = censys.certificates.CensysCertificates(
            api_id=decrypt_api_key(CENSYS_API_ID, censys_id_key),
            api_secret=decrypt_api_key(CENSYS_API_SECRET, censys_secret_key)
        )
        cert_results = list(certificates_api.search(query, per_page=100))
        
        websites_api = censys.websites.CensysWebsites(
            api_id=decrypt_api_key(CENSYS_API_ID, censys_id_key),
            api_secret=decrypt_api_key(CENSYS_API_SECRET, censys_secret_key)
        )
        website_results = list(websites_api.search(query, per_page=100))
        
        logger.info(f"Multi-source Censys search for '{query}' successful.")
        return {
            "hosts": hosts_results,
            "certificates": cert_results,
            "websites": website_results
        }
    except Exception as e:
        logger.error(f"Multi-source Censys search failed: {e}")
        return {}

def advanced_google_dork_search(domain, dorks, count=10):
    """Perform Google dork searches with advanced error handling, rate limiting, and proxy rotation."""
    results = {}
    proxies = [
        'socks5://127.0.0.1:9050',  # Tor proxy
        'http://user:pass@10.10.1.10:3128',  # Example HTTP proxy
    ]
    
    for dork in dorks:
        query = f"site:{domain} {dork}"
        try:
            urls = []
            for start in range(0, count, 10):
                proxy = random.choice(proxies)
                response = requests.get(
                    f"https://www.google.com/search?q={urllib.parse.quote(query)}&start={start}",
                    headers={'User-Agent': UserAgent().random},
                    proxies={'http': proxy, 'https': proxy},
                    timeout=10
                )
                soup = bs4(response.text, 'html.parser')
                search_results = soup.select('.yuRUbf > a')
                urls.extend([result['href'] for result in search_results])
                time.sleep(random.uniform(2, 5))  # Random delay between requests
            
            results[dork] = urls[:count]
            logger.info(f"Google dork search for '{dork}' on {domain} successful.")
        except Exception as e:
            logger.error(f"Google dork search failed for '{dork}': {e}")
            results[dork] = []
    
    return results

def comprehensive_technology_detection(url):
    """Detect technologies used by the website with extended capabilities and multiple sources."""
    try:
        results = {}
        
        # BuiltWith
        results['builtwith'] = builtwith.parse(url)
        
        # Custom technology checks
        results['custom_checks'] = custom_technology_checks(url)
        
        # Additional sources
        results['whatcms'] = whatcms_detection(url)
        results['retire_js'] = retire_js_detection(url)
        results['httpx'] = httpx_detection(url)
        
        logger.info(f"Comprehensive technology detection for {url} successful.")
        return results
    except Exception as e:
        logger.error(f"Comprehensive technology detection failed: {e}")
        return None

def custom_technology_checks(url):
    """Perform custom technology checks."""
    custom_techs = {}
    try:
        response = requests.get(url, timeout=10)
        if 'X-Powered-By' in response.headers:
            custom_techs['X-Powered-By'] = response.headers['X-Powered-By']
        if 'Server' in response.headers:
            custom_techs['Server'] = response.headers['Server']
        if 'X-AspNet-Version' in response.headers:
            custom_techs['ASP.NET'] = response.headers['X-AspNet-Version']
        
        # Check for common JavaScript libraries
        soup = bs4(response.text, 'html.parser')
        scripts = soup.find_all('script', src=True)
        for script in scripts:
            src = script['src'].lower()
            if 'jquery' in src:
                custom_techs['jQuery'] = 'Detected'
            elif 'angular' in src:
                custom_techs['Angular'] = 'Detected'
            elif 'react' in src:
                custom_techs['React'] = 'Detected'
            elif 'vue' in src:
                custom_techs['Vue.js'] = 'Detected'
        
        # Check for common CMS
        if 'wp-content' in response.text:
            custom_techs['WordPress'] = 'Detected'
        elif 'Drupal.settings' in response.text:
            custom_techs['Drupal'] = 'Detected'
        elif 'Joomla!' in response.text:
            custom_techs['Joomla'] = 'Detected'
        
    except Exception as e:
        logger.error(f"Custom technology check failed: {e}")
    return custom_techs

def custom_email_harvest(domain):
    """Custom email harvesting function."""
    emails = set()
    try:
        # Web scraping
        response = requests.get(f"http://{domain}", timeout=10)
        soup = bs4(response.text, 'html.parser')
        email_regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails.update(re.findall(email_regex, soup.text))
        
        # DNS MX record check
        mx_records = dns.resolver.resolve(domain, 'MX')
        for mx in mx_records:
            emails.add(f"postmaster@{mx.exchange.to_text().rstrip('.')}")
        
        # WHOIS data
        whois_info = whois.whois(domain)
        if whois_info.emails:
            emails.update(whois_info.emails)
        
        # Google search
        search_query = f"@{domain}"
        for url in googlesearch.search(search_query, num_results=20):
            response = requests.get(url, timeout=10)
            emails.update(re.findall(email_regex, response.text))
        
    except Exception as e:
        logger.error(f"Custom email harvest failed: {e}")
    return emails

def verify_emails(email_list):
    """Verify harvested email addresses."""
    verified_emails = []
    for email in email_list:
        try:
            # DNS check
            domain = email.split('@')[1]
            dns.resolver.resolve(domain, 'MX')
            
            # SMTP check (be cautious with this to avoid being blocked)
            # This is a simplified example and should be used carefully
            with smtplib.SMTP(domain) as server:
                server.ehlo()
                server.mail('')
                code, _ = server.rcpt(email)
                if code == 250:
                    verified_emails.append(email)
        except Exception:
            pass
    return verified_emails

def comprehensive_domain_info(domain):
    """Gather comprehensive domain information from multiple sources."""
    results = {}
    
    # Spyse
    try:
        client = spyse.Client()
        results['spyse'] = client.get_domain_details(domain)
        time.sleep(1)  # Rate limiting
    except Exception as e:
        logger.error(f"Spyse domain info gathering failed: {e}")
    
    # SecurityTrails
    # try:
    #     st = SecurityTrails(decrypt_api_key(SECURITYTRAILS_API_KEY, securitytrails_key))
    #     results['securitytrails'] = st.domain_info(domain)
    # except Exception as e:
    #     logger.error(f"SecurityTrails domain info gathering failed: {e}")
    
    # VirusTotal
    try:
        vt = virustotal_python.Virustotal(decrypt_api_key(VIRUSTOTAL_API_KEY, virustotal_key))
        results['virustotal'] = vt.domain_report(domain)
    except Exception as e:
        logger.error(f"VirusTotal domain info gathering failed: {e}")
    
    # RiskIQ PassiveTotal
    try:
        client = passivetotal.Client(decrypt_api_key(PASSIVETOTAL_API_KEY, passivetotal_key))
        results['passivetotal'] = client.get_enrichment(query=domain)
    except Exception as e:
        logger.error(f"PassiveTotal domain info gathering failed: {e}")
    
    logger.info(f"Comprehensive domain info gathering for {domain} completed.")
    return results

def advanced_ssl_info(domain):
    """Gather advanced SSL certificate information."""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443)) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as secure_sock:
                cert = secure_sock.getpeercert()
        
        # Additional SSL checks
        cert_details = {}
        cert_details['subject'] = dict(x[0] for x in cert['subject'])
        cert_details['issuer'] = dict(x[0] for x in cert['issuer'])
        cert_details['version'] = cert['version']
        cert_details['serialNumber'] = cert['serialNumber']
        cert_details['notBefore'] = cert['notBefore']
        cert_details['notAfter'] = cert['notAfter']
        cert_details['subjectAltName'] = cert.get('subjectAltName', [])
        cert_details['OCSP'] = cert.get('OCSP', [])
        cert_details['caIssuers'] = cert.get('caIssuers', [])
        cert_details['crlDistributionPoints'] = cert.get('crlDistributionPoints', [])
        
        # Check certificate transparency
        ct_logs = requests.get(f"https://crt.sh/?q={domain}&output=json").json()
        cert_details['certificate_transparency'] = ct_logs[:10]  # Limit to first 10 entries
        
        # Check for known vulnerabilities
        vulnerabilities = check_ssl_vulnerabilities(domain)
        cert_details['vulnerabilities'] = vulnerabilities
        
        logger.info(f"Advanced SSL info gathering for {domain} successful.")
        return cert_details
    except Exception as e:
        logger.error(f"Advanced SSL info gathering failed: {e}")
        return None

def check_ssl_vulnerabilities(domain):
    """Check for known SSL/TLS vulnerabilities."""
    vulnerabilities = []
    try:
        # Check for Heartbleed
        heartbleed = subprocess.run(['sslyze', '--heartbleed', domain], capture_output=True, text=True)
        if 'VULNERABLE' in heartbleed.stdout:
            vulnerabilities.append('Heartbleed')
        
        # Check for POODLE
        poodle = subprocess.run(['sslyze', '--fallback', domain], capture_output=True, text=True)
        if 'VULNERABLE' in poodle.stdout:
            vulnerabilities.append('POODLE')
        
        # Check for FREAK
        freak = subprocess.run(['sslyze', '--freak', domain], capture_output=True, text=True)
        if 'VULNERABLE' in freak.stdout:
            vulnerabilities.append('FREAK')
        
        # Add more vulnerability checks as needed
    except Exception as e:
        logger.error(f"SSL vulnerability check failed: {e}")
    
    return vulnerabilities

def comprehensive_subdomain_enumeration(domain):
    """Enumerate subdomains using multiple tools and techniques."""
    subdomains = set()
    
    # Sublist3r
    subdomains.update(sublist3r.main(domain, 40, savefile=None, ports=None, silent=True, verbose=False, enable_bruteforce=False, engines=None))
    
    # Amass
    amass_output = subprocess.run(['amass', 'enum', '-d', domain], capture_output=True, text=True)
    subdomains.update(amass_output.stdout.splitlines())
    
    # Subfinder
    subfinder_output = subprocess.run(['subfinder', '-d', domain], capture_output=True, text=True)
    subdomains.update(subfinder_output.stdout.splitlines())
    
    # Asynchronous DNS brute-force
    wordlist = load_subdomain_wordlist()
    brute_force_subdomains = asyncio.run(async_dns_brute_force(domain, wordlist))
    subdomains.update(brute_force_subdomains)
    
    # Censys subdomain enumeration
    censys_subdomains = censys_subdomain_enum(domain)
    subdomains.update(censys_subdomains)
    
    # Certificate Transparency logs
    ct_subdomains = certificate_transparency_enum(domain)
    subdomains.update(ct_subdomains)
    
    logger.info(f"Comprehensive subdomain enumeration for {domain} completed.")
    return subdomains