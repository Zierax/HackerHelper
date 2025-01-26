import { ScanResult } from '../securityScanner';

export class NetworkScanner {
  async runSelectedScans(target: string, selectedScans: string[]): Promise<ScanResult> {
    const scanResults: { [key: string]: any } = {};

    for (const scan of selectedScans) {
      switch (scan) {
        case 'http-enum':
          scanResults[scan] = await this.httpEnum(target);
          break;
        case 'ssl-enum':
          scanResults[scan] = await this.sslEnum(target);
          break;
        case 'dns-brute':
          scanResults[scan] = await this.dnsBrute(target);
          break;
        case 'smb-enum':
          scanResults[scan] = await this.smbEnum(target);
          break;
        case 'mysql-enum':
          scanResults[scan] = await this.mysqlEnum(target);
          break;
        case 'nmap-scan':
          scanResults[scan] = await this.nmapScan(target);
          break;
        default:
          scanResults[scan] = {
            status: 'error',
            message: `Unknown scan type: ${scan}`,
          };
      }
    }

    return {
      status: 'success',
      message: 'Network scans completed',
      details: scanResults,
    };
  }

  async scan(target: string): Promise<ScanResult> {
    const scanResults: { [key: string]: ScanResult } = {};

    for (const scanType of ['http-enum', 'ssl-enum', 'dns-brute', 'smb-enum', 'mysql-enum', 'nmap-scan']) {
      scanResults[scanType] = await this[scanType](target); 
    }


    return {
      status: 'success',
      message: 'Network scan completed',
      details: scanResults,
    };
  }

  async httpEnum(target: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/network/http-enum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        message: `HTTP Enumeration for ${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async sslEnum(target: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/network/ssl-enum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, port: 443 })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        message: `SSL Enumeration for ${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async dnsBrute(target: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/network/dns-brute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: target })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        message: `DNS Brute Force for ${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async smbEnum(target: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/network/smb-enum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        message: `SMB Enumeration for ${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async mysqlEnum(target: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/network/mysql-enum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target, port: 3306 })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        message: `MySQL Enumeration for ${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async nmapScan(target: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3001/network/nmap-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target })
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return data;
    } catch (error) {
      return {
        status: 'error',
        message: `NMAP Scan for ${target} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}