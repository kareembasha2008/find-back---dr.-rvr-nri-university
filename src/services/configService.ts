import { SystemConfig } from '../types';

const CONFIG_STORAGE_KEY = 'findback_system_config';

const DEFAULT_CONFIG: SystemConfig = {
  university_name: 'Dr. RVR NRI University',
  university_campus: 'Agiripalli',
  allowed_email_domain: 'gmail.com',
  require_domain_match: true,
};

export const configService = {
  getConfig(): SystemConfig {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Automatically migrate legacy university domain to gmail.com
        if (parsed.allowed_email_domain === 'drrvrnri.edu.in') {
          parsed.allowed_email_domain = 'gmail.com';
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(parsed));
        }
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load system config', e);
    }
    return DEFAULT_CONFIG;
  },

  updateConfig(updates: Partial<SystemConfig>): SystemConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Validates if the email belongs to the configured domain (default: gmail.com).
   * Also accepts googlemail.com and campus academic domains for compatibility.
   */
  isValidUniversityEmail(email: string): { valid: boolean; message?: string } {
    if (!email || !email.includes('@')) {
      return { valid: false, message: 'Please enter a valid Gmail address.' };
    }
    const config = this.getConfig();
    const domain = email.trim().toLowerCase().split('@')[1];

    if (!config.require_domain_match) {
      return { valid: true };
    }

    const expectedDomain = config.allowed_email_domain.toLowerCase();
    
    // Check if domain is gmail.com or googlemail.com or matches configured domain
    const isGmail = expectedDomain === 'gmail.com' && (domain === 'gmail.com' || domain === 'googlemail.com');
    const isExactOrSubdomain = domain === expectedDomain || domain.endsWith(`.${expectedDomain}`);
    // Also allow common alternative university domain alias if previously used
    const isEduIn = domain.endsWith('.edu.in') || domain.endsWith('.ac.in');

    if (isGmail || isExactOrSubdomain || isEduIn) {
      return { valid: true };
    }

    return {
      valid: false,
      message: `Please use a valid Gmail address (@${config.allowed_email_domain}).`,
    };
  },
};
