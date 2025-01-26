import { NetworkScanner } from './hooks/NetworkScanner';
import { VulnerabilityScanner } from './hooks/Vulnerability';
import { ReconScanner } from './hooks/Recon';

export interface ScanResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class SecurityScanner {
  private networkScanner: NetworkScanner;
  private vulnerabilityScanner: VulnerabilityScanner;
  private reconScanner: ReconScanner;

  constructor() {
    this.networkScanner = new NetworkScanner();
    this.vulnerabilityScanner = new VulnerabilityScanner();
    this.reconScanner = new ReconScanner();
  }

  async performFullScan(target: string, options?: { network?: boolean; vulnerability?: boolean; recon?: boolean }): Promise<Record<string, ScanResult>> {
    const results: Record<string, ScanResult> = {};

    try {
      if (options?.network) {
        // Network scan
        results.network = await this.networkScanner.scan(target); // Add scan method to NetworkScanner class
      }

      if (options?.vulnerability) {
        // Vulnerability scan
        results.vulnerability = await this.vulnerabilityScanner.performFullVulnerabilityScan(target);
      }

      if (options?.recon) {
        // Recon scan
        results.recon = await this.reconScanner.runSelectedScans(target, ['whois', 'shodan', 'domain-info', 'email-harvest', 'technology-detection']);
      }

      return results;
    } catch (error) {
      console.error('Scan failed:', error);
      throw new Error('Security scan failed');
    }
  }
}
