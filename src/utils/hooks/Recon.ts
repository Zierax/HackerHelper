import { ScanResult } from '../securityScanner';

export class ReconScanner {
  async runSelectedScans(target: string, selectedScans: string[]): Promise<ScanResult> {
    const scanResults: { [key: string]: ScanResult } = {};

    for (const scan of selectedScans) {
      switch (scan) {
        case 'whois':
          scanResults[scan] = await this.whois(target);
          break;
        case 'shodan':
          scanResults[scan] = await this.shodan(target);
          break;
        case 'censys':
          scanResults[scan] = await this.censys(target);
          break;
        case 'google-dork':
          scanResults[scan] = await this.googleDork(target, []); // Assuming dorks are not provided in this context
          break;
        case 'technology-detection':
          scanResults[scan] = await this.technologyDetection(target);
          break;
        case 'email-harvest':
          scanResults[scan] = await this.emailHarvest(target);
          break;
        case 'domain-info':
          scanResults[scan] = await this.domainInfo(target);
          break;
        default:
          scanResults[scan] = {
            status: 'error',
            message: `Unknown scan type: ${scan}`,
          };
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          target: target,
          scans: selectedScans,
          results: scanResults
        });
      }, 1000);
    });
  }

  async whois(domain: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/whois`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Whois lookup for ${domain} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Whois lookup for ${domain} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async shodan(query: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/shodan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Shodan search for ${query} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Shodan search for ${query} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async censys(query: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/censys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Censys search for ${query} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Censys search for ${query} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async googleDork(domain: string, dorks: string[]): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/google-dork`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, dorks })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Google Dork search for ${domain} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Google Dork search for ${domain} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async technologyDetection(url: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/technology-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Technology detection for ${url} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Technology detection for ${url} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async emailHarvest(domain: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/email-harvest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Email harvesting for ${domain} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Email harvesting for ${domain} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async domainInfo(domain: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/domain-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `Domain info for ${domain} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Domain info for ${domain} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async cveSearch(keyword: string): Promise<ScanResult> {
    try {
      const response = await fetch(`http://localhost:3001/recon/cve-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword })
      });

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      return {
        status: 'success',
        message: `CVE search for ${keyword} completed`,
        details: data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `CVE search for ${keyword} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}