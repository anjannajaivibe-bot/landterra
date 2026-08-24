/**
 * Phone Number OTP Service Abstraction
 * Handles generation, expiration, rate-limiting, and delivery via configured SMS gateways
 * (Twilio, Fast2SMS, or clean test mode in local/preview)
 */

interface OtpStore {
  [phone: string]: {
    otp: string;
    expiresAt: number;
    attempts: number;
  };
}

// In-memory OTP cache for fast verification & expiry handling (backed by DB in multi-instance prod)
const otpStore: OtpStore = {};

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  isTestMode?: boolean;
  testOtpPreview?: string; // Provided only when running without live external SMS provider
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}

/**
 * Generate a 6-digit numeric OTP
 */
function generateRandomOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Clean and format Indian 10-digit phone number with +91 country code
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

/**
 * Send OTP to a phone number
 */
export async function sendOtpToPhone(rawPhone: string): Promise<SendOtpResult> {
  const phone = normalizePhoneNumber(rawPhone);
  if (!phone || phone.length < 12) {
    return { success: false, message: 'Please provide a valid 10-digit mobile number' };
  }

  // Rate limiting check: check if an OTP was issued recently
  const existing = otpStore[phone];
  const now = Date.now();
  if (existing && existing.expiresAt - now > 4 * 60 * 1000) {
    return {
      success: false,
      message: 'Please wait 60 seconds before requesting another OTP',
    };
  }

  const otp = generateRandomOtp();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

  otpStore[phone] = {
    otp,
    expiresAt,
    attempts: 0,
  };

  const provider = (process.env.SMS_PROVIDER || process.env.OTP_PROVIDER || 'test').toLowerCase();

  // 1. Twilio SMS
  if (provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', phone);
      params.append('From', process.env.TWILIO_PHONE_NUMBER || '');
      params.append('Body', `Your BhoomiMitra verification code is ${otp}. Valid for 5 minutes. Do not share.`);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        return { success: true, message: `OTP sent successfully to ${phone}`, expiresInSeconds: 300 };
      }
    } catch (e) {
      console.error('Twilio SMS error:', e);
    }
  }

  // 2. Fast2SMS (Indian SMS Gateway)
  if (provider === 'fast2sms' && process.env.FAST2SMS_API_KEY) {
    try {
      const indianNumber = phone.replace('+91', '');
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables_values: otp,
          route: 'otp',
          numbers: indianNumber,
        }),
      });
      if (res.ok) {
        return { success: true, message: `OTP sent successfully to ${phone}`, expiresInSeconds: 300 };
      }
    } catch (e) {
      console.error('Fast2SMS error:', e);
    }
  }

  // In production, real SMS gateway is mandatory. Simulated OTP is strictly forbidden.
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return {
      success: false,
      message: 'SMS Gateway service is not configured or delivery failed. Please configure TWILIO or FAST2SMS credentials.',
      isTestMode: false,
    };
  }

  // Development / Preview test mode fallback only when running outside production:
  return {
    success: true,
    message: `[DEV/TEST MODE] OTP generated for ${phone}. Valid for 5 minutes.`,
    expiresInSeconds: 300,
    isTestMode: true,
    testOtpPreview: otp,
  };
}

/**
 * Verify OTP
 */
export async function verifyOtpForPhone(rawPhone: string, code: string): Promise<VerifyOtpResult> {
  const phone = normalizePhoneNumber(rawPhone);
  const record = otpStore[phone];

  if (!record) {
    return { success: false, message: 'No active OTP request found for this number. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[phone];
    return { success: false, message: 'OTP has expired. Please request a fresh OTP.' };
  }

  if (record.attempts >= 5) {
    delete otpStore[phone];
    return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (record.otp !== code.trim()) {
    record.attempts += 1;
    return { success: false, message: 'Invalid OTP code. Please check and try again.' };
  }

  // Verification successful, delete token
  delete otpStore[phone];
  return { success: true, message: 'Phone number verified successfully.' };
}
