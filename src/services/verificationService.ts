export interface SendCodeResult {
  success: boolean;
  message: string;
  type: 'email' | 'phone';
  target: string;
  expiresAt: number;
  debugCode?: string;
}

export interface CheckCodeResult {
  success: boolean;
  verified: boolean;
  message?: string;
  error?: string;
}

export const verificationService = {
  /**
   * Dispatches a 6-digit OTP code to the student's Gmail or Phone number
   */
  async sendCode(target: string, type: 'email' | 'phone', fullName?: string): Promise<SendCodeResult> {
    const cleanTarget = target.trim();
    if (!cleanTarget) {
      throw new Error('Please enter a valid Gmail address or phone number.');
    }

    const response = await fetch('/api/verify/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: cleanTarget,
        type,
        fullName,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to dispatch verification code.');
    }

    return data;
  },

  /**
   * Validates the 6-digit OTP code
   */
  async verifyCode(target: string, code: string): Promise<CheckCodeResult> {
    const cleanTarget = target.trim();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      throw new Error('Please enter the complete 6-digit verification code.');
    }

    const response = await fetch('/api/verify/check-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: cleanTarget,
        code: cleanCode,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Invalid verification code. Please try again.');
    }

    return data;
  },
};
