import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Database, AlertTriangle, RefreshCw, Scan, Zap, Target, Lock, Globe, Search as SearchIcon } from 'lucide-react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:3001/api/v1';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for API key handling
api.interceptors.request.use(
  (config) => {
    // Add any API keys from localStorage if they exist
    const shodan_api_key = localStorage.getItem('shodan_api_key');
    const censys_api_id = localStorage.getItem('censys_api_id');
    const censys_api_secret = localStorage.getItem('censys_api_secret');

    if (config.url?.includes('shodan') && shodan_api_key) {
      config.headers['X-Shodan-API-Key'] = shodan_api_key;
    }
    if (config.url?.includes('censys') && censys_api_id && censys_api_secret) {
      config.headers['X-Censys-API-ID'] = censys_api_id;
      config.headers['X-Censys-API-Secret'] = censys_api_secret;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unknown error occurred';
    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 400:
          errorMessage = 'Invalid request parameters';
          break;
        case 401:
          errorMessage = 'Authentication required';
          break;
        case 403:
          errorMessage = 'Access forbidden';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = error.response.data?.message || errorMessage;
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'No response from server. Please check your connection';
    }
    return Promise.reject(new Error(errorMessage));
  }
);

interface ScanConfig {
  id: string;
  icon: any;
  label: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    placeholder: string;
    required: boolean;
    options?: string[];
  }[];
}

const SecurityTools: React.FC = () => {
  const { theme } = useOutletContext<{ theme: string }>();
  const [activeTab, setActiveTab] = useState<'vulnerability' | 'network' | 'recon'>('vulnerability');
  const [target, setTarget] = useState('');
  const [selectedScans, setSelectedScans] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanParameters, setScanParameters] = useState<Record<string, Record<string, string>>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const isDarkMode = theme === 'dark';

  // Load API keys from localStorage on component mount
  useEffect(() => {
    const keys = ['shodan_api_key', 'censys_api_id', 'censys_api_secret'];
    const loadedKeys: Record<string, string> = {};
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) loadedKeys[key] = value;
    });
    setApiKeys(loadedKeys);
  }, []);

  const handleApiKeyChange = useCallback((key: string, value: string) => {
    setApiKeys(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(key, value);
      return updated;
    });
  }, []);

  const validateScanParameters = useCallback((scanType: string, parameters: ScanConfig['parameters']) => {
    const currentParams = scanParameters[scanType] || {};
    const missingParams = parameters
      .filter(param => param.required && !currentParams[param.name])
      .map(param => param.name);
    
    if (missingParams.length > 0) {
      setError(`Missing required parameters for ${scanType}: ${missingParams.join(', ')}`);
      return false;
    }

    // Validate API keys for specific scan types
    if (scanType === 'shodan' && !apiKeys.shodan_api_key) {
      setError('Shodan API key is required');
      return false;
    }
    if (scanType === 'censys' && (!apiKeys.censys_api_id || !apiKeys.censys_api_secret)) {
      setError('Censys API credentials are required');
      return false;
    }

    return true;
  }, [scanParameters, apiKeys]);

  const handleScan = useCallback(async () => {
    const selectedScanConfigs = selectedScans.map(scanId => 
      scans[activeTab].find(scan => scan.id === scanId)
    ).filter((scan): scan is ScanConfig => scan !== undefined);

    if (selectedScanConfigs.length === 0) {
      setError('Please select at least one scan type');
      return;
    }

    // Validate parameters for all selected scans
    const isValid = selectedScanConfigs.every(scan => 
      validateScanParameters(scan.id, scan.parameters)
    );

    if (!isValid) return;

    setIsLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const results = await Promise.all(
        selectedScanConfigs.map(async (scan) => {
          const endpoint = `${activeTab}/${scan.id}`;
          const scanParams = scanParameters[scan.id] || {};
          
          const payload = {
            ...scanParams,
            target: target // Add target as fallback
          };

          const response = await api.post(endpoint, payload);
          return {
            type: scan.id,
            ...response.data
          };
        })
      );

      const combinedResult = {
        status: results.some(r => r.status === 'error') ? 'error' : 'success',
        message: 'Scan completed',
        details: results.reduce((acc, curr) => {
          acc[curr.type] = curr;
          return acc;
        }, {} as Record<string, any>)
      };

      setScanResult(combinedResult);
      toast[combinedResult.status === 'error' ? 'error' : 'success'](combinedResult.message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, target, selectedScans, scanParameters, validateScanParameters]);

  const scans: Record<string, ScanConfig[]> = {
    vulnerability: [
      { 
        id: 'xss', 
        icon: Shield, 
        label: 'XSS', 
        description: 'Cross-site scripting vulnerabilities',
        parameters: [
          { name: 'url', type: 'text', placeholder: 'Enter target URL', required: true }
        ]
      },
      { 
        id: 'csrf', 
        icon: Lock, 
        label: 'CSRF', 
        description: 'Cross-site request forgery protection',
        parameters: [
          { name: 'url', type: 'text', placeholder: 'Enter target URL', required: true }
        ]
      },
      { 
        id: 'clickjacking', 
        icon: Target, 
        label: 'Clickjacking', 
        description: 'UI redress attacks',
        parameters: [
          { name: 'url', type: 'text', placeholder: 'Enter target URL', required: true }
        ]
      },
      { 
        id: 'sql-injection', 
        icon: Database, 
        label: 'SQL Injection', 
        description: 'Database injection vulnerabilities',
        parameters: [
          { name: 'url', type: 'text', placeholder: 'Enter target URL', required: true },
          { name: 'parameters', type: 'text', placeholder: 'Enter parameters (comma-separated)', required: true }
        ]
      },
      { 
        id: 'ssl-tls', 
        icon: Lock, 
        label: 'SSL/TLS', 
        description: 'Transport layer security issues',
        parameters: [
          { name: 'host', type: 'text', placeholder: 'Enter hostname', required: true },
          { name: 'port', type: 'text', placeholder: 'Enter port (default: 443)', required: false }
        ]
      }
    ],
    network: [
      { 
        id: 'http-enum', 
        icon: Globe, 
        label: 'HTTP Enum', 
        description: 'HTTP service enumeration',
        parameters: [
          { name: 'target', type: 'text', placeholder: 'Enter target URL/IP', required: true },
          { name: 'ports', type: 'text', placeholder: 'Enter ports (comma-separated)', required: false }
        ]
      },
      { 
        id: 'ssl-enum', 
        icon: Shield, 
        label: 'SSL Enum', 
        description: 'SSL/TLS configuration analysis',
        parameters: [
          { name: 'target', type: 'text', placeholder: 'Enter hostname', required: true },
          { name: 'port', type: 'text', placeholder: 'Enter port (default: 443)', required: false }
        ]
      },
      { 
        id: 'dns-brute', 
        icon: Database, 
        label: 'DNS Brute', 
        description: 'DNS subdomain discovery',
        parameters: [
          { name: 'domain', type: 'text', placeholder: 'Enter domain name', required: true },
          { name: 'wordlist', type: 'text', placeholder: 'Enter wordlist path (optional)', required: false }
        ]
      },
      { 
        id: 'smb-enum', 
        icon: Database, 
        label: 'SMB Enum', 
        description: 'Windows sharing enumeration',
        parameters: [
          { name: 'target', type: 'text', placeholder: 'Enter target IP', required: true },
          { name: 'port', type: 'text', placeholder: 'Enter port (default: 445)', required: false },
          { name: 'username', type: 'text', placeholder: 'Enter username (optional)', required: false },
          { name: 'password', type: 'password', placeholder: 'Enter password (optional)', required: false }
        ]
      },
      { 
        id: 'mysql-enum', 
        icon: Database, 
        label: 'MySQL Enum', 
        description: 'MySQL service discovery',
        parameters: [
          { name: 'target', type: 'text', placeholder: 'Enter target IP', required: true },
          { name: 'port', type: 'text', placeholder: 'Enter port (default: 3306)', required: false },
          { name: 'username', type: 'text', placeholder: 'Enter username (optional)', required: false },
          { name: 'password', type: 'password', placeholder: 'Enter password (optional)', required: false }
        ]
      },
      { 
        id: 'nmap-scan', 
        icon: SearchIcon, 
        label: 'NMAP', 
        description: 'Network mapping and port scanning',
        parameters: [
          { name: 'target', type: 'text', placeholder: 'Enter IP address or hostname', required: true },
          { name: 'ports', type: 'text', placeholder: 'Enter ports (e.g., 80,443,8080)', required: false },
          { name: 'arguments', type: 'text', placeholder: 'Additional nmap arguments', required: false }
        ]
      }
    ],
    recon: [
      { 
        id: 'whois', 
        icon: Globe, 
        label: 'WHOIS', 
        description: 'Domain registration info',
        parameters: [
          { name: 'domain', type: 'text', placeholder: 'Enter domain name', required: true }
        ]
      },
      { 
        id: 'shodan', 
        icon: SearchIcon, 
        label: 'Shodan', 
        description: 'Internet-wide device search',
        parameters: [
          { name: 'query', type: 'text', placeholder: 'Enter Shodan search query', required: true },
          { name: 'api_key', type: 'password', placeholder: 'Enter Shodan API key', required: true }
        ]
      },
      { 
        id: 'censys', 
        icon: SearchIcon, 
        label: 'Censys', 
        description: 'Internet security intelligence',
        parameters: [
          { name: 'query', type: 'text', placeholder: 'Enter Censys search query', required: true },
          { name: 'api_id', type: 'text', placeholder: 'Enter Censys API ID', required: true },
          { name: 'api_secret', type: 'password', placeholder: 'Enter Censys API Secret', required: true }
        ]
      },
      { 
        id: 'google-dork', 
        icon: SearchIcon, 
        label: 'Google Dork', 
        description: 'Advanced Google search techniques',
        parameters: [
          { name: 'domain', type: 'text', placeholder: 'Enter target domain', required: true },
          { name: 'dork', type: 'text', placeholder: 'Enter dork query', required: true }
        ]
      },
      { 
        id: 'technology-detection', 
        icon: Zap, 
        label: 'Tech Detect', 
        description: 'Technology stack identification',
        parameters: [
          { name: 'url', type: 'text', placeholder: 'Enter target URL', required: true }
        ]
      },
      { 
        id: 'email-harvest', 
        icon: Database, 
        label: 'Email Harvest', 
        description: 'Email address discovery',
        parameters: [
          { name: 'domain', type: 'text', placeholder: 'Enter domain name', required: true },
          { name: 'depth', type: 'number', placeholder: 'Search depth (1-3)', required: false }
        ]
      },
      { 
        id: 'domain-info', 
        icon: Globe, 
        label: 'Domain Info', 
        description: 'Domain information gathering',
        parameters: [
          { name: 'domain', type: 'text', placeholder: 'Enter domain name', required: true }
        ]
      },
      { 
        id: 'ssl-info', 
        icon: Lock, 
        label: 'SSL Info', 
        description: 'SSL certificate analysis',
        parameters: [
          { name: 'host', type: 'text', placeholder: 'Enter hostname', required: true },
          { name: 'port', type: 'text', placeholder: 'Enter port (default: 443)', required: false }
        ]
      },
      { 
        id: 'subdomain-enum', 
        icon: Database, 
        label: 'Subdomains', 
        description: 'Subdomain enumeration',
        parameters: [
          { name: 'domain', type: 'text', placeholder: 'Enter domain name', required: true },
          { name: 'method', type: 'select', placeholder: 'Select enumeration method', required: false, 
            options: ['bruteforce', 'certificate', 'dns', 'all'] }
        ]
      },
      { 
        id: 'cve-search', 
        icon: AlertTriangle, 
        label: 'CVE Search', 
        description: 'Common Vulnerabilities and Exposures search',
        parameters: [
          { name: 'keyword', type: 'text', placeholder: 'Enter search keyword', required: true },
          { name: 'year', type: 'text', placeholder: 'Enter year (YYYY)', required: false },
          { name: 'severity', type: 'select', placeholder: 'Select severity', required: false,
            options: ['low', 'medium', 'high', 'critical'] }
        ]
      }
    ]
  };

  const tabIcons = {
    vulnerability: Shield,
    network: Globe,
    recon: SearchIcon
  };

  const handleTargetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
    setError(null);
    setScanResult(null);
  }, []);

  const handleParameterChange = useCallback((scanId: string, paramName: string, value: string) => {
    setScanParameters(prev => ({
      ...prev,
      [scanId]: {
        ...(prev[scanId] || {}),
        [paramName]: value
      }
    }));
  }, []);

  const handleScanSelect = useCallback((scan: string) => {
    setSelectedScans(prevScans => 
      prevScans.includes(scan) ? prevScans.filter(s => s !== scan) : [...prevScans, scan]
    );
    setError(null);
    setScanResult(null);
  }, []);

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-gray-800 to-gray-900'
        : 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-100 to-blue-50'
    } transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <h1 className={`text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
            isDarkMode ? 'from-blue-400 to-purple-500' : 'from-blue-600 to-purple-700'
          }`}>
            Security Tools
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Comprehensive security scanning and analysis toolkit
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl ${
            isDarkMode 
              ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700'
              : 'bg-white/70 backdrop-blur-lg border border-gray-100'
          } shadow-2xl space-y-8 p-8`}
        >
          <div className="flex gap-4">
            {Object.entries(scans).map(([tab, _]) => {
              const TabIcon = tabIcons[tab as keyof typeof tabIcons];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as keyof typeof scans)}
                  className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 ${
                    activeTab === tab 
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TabIcon className={`w-5 h-5 ${activeTab === tab ? 'text-white' : ''}`} />
                  <span className="font-medium">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={target}
                onChange={handleTargetChange}
                placeholder="Enter target URL or IP address..."
                className={`w-full p-4 pl-12 rounded-xl border-2 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
              <Target className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {scans[activeTab].map((scan) => (
                <motion.button
                  key={scan.id}
                  onClick={() => handleScanSelect(scan.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl flex flex-col items-center gap-3 transition-all duration-300 ${
                    selectedScans.includes(scan.id)
                      ? isDarkMode
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : isDarkMode
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    selectedScans.includes(scan.id)
                      ? 'bg-white/20'
                      : isDarkMode ? 'bg-gray-600/50' : 'bg-white/50'
                  }`}>
                    <scan.icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{scan.label}</div>
                    <div className={`text-xs mt-1 ${
                      selectedScans.includes(scan.id)
                        ? 'text-white/80'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {scan.description}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {selectedScans.length > 0 && (
              <div className="space-y-4 mt-4">
                {selectedScans.map(scanId => {
                  const scan = scans[activeTab].find(s => s.id === scanId);
                  if (!scan) return null;

                  return (
                    <div key={scanId} className={`p-4 rounded-xl ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <h3 className={`text-lg font-medium mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{scan.label} Parameters</h3>
                      <div className="space-y-2">
                        {scan.parameters.map(param => (
                          <input
                            key={`${scanId}-${param.name}`}
                            type={param.type}
                            placeholder={param.placeholder}
                            value={scanParameters[scanId]?.[param.name] || ''}
                            onChange={(e) => handleParameterChange(scanId, param.name, e.target.value)}
                            className={`w-full p-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <motion.button
              onClick={handleScan}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-medium transition-all duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:from-gray-700 disabled:to-gray-700'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white disabled:from-gray-300 disabled:to-gray-300'
              } shadow-lg shadow-blue-500/25`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Scanning Target...</span>
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  <span>Launch Scan</span>
                </>
              )}
            </motion.button>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex items-start gap-3 p-4 rounded-xl ${
                    isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-600'
                  } border ${isDarkMode ? 'border-red-800' : 'border-red-100'}`}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {scanResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-3"
                >
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Scan Results
                  </h3>
                  <div className={`rounded-xl p-6 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  } border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <pre className={`text-sm whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                      {JSON.stringify(scanResult, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SecurityTools;
