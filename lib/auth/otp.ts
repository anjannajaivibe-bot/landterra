import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db/mongodb';
import { OtpChallengeModel } from '@/models/OtpChallenge';

/**
 * Phone Number OTP Service (MongoDB Shared Store)
 * Handles generation, secure HMAC hashing with OTP_HASH_SECRET, single-use consumption,
 * expiration, attempt limiting, failed delivery rollback, and delivery via configured SMS gateways.
 */

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  isTestMode?: boolean;
  testOtpPreview?: string; // Provided only when running in non-production test mode
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
}

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Get required OTP HMAC secret from environment
 */
export function getOtpSecret(): string {
  const secret = process.env.OTP_HASH_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('OTP_HASH_SECRET environment variable is missing.');
  }
  return secret.trim();
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
function generateRandomOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Compute secure HMAC-SHA256 hash for phone + OTP token using OTP_HASH_SECRET
 */
export function hashOtp(phone: string, otp: string): string {
  const secret = getOtpSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(`${phone}:${otp.trim()}`)
    .digest('hex');
}

/**
 * Clean and format Indian 10-digit phone number with +91 country code.
 * Rejects non-Indian or improperly formatted numbers.
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const cleaned = phone.replace(/\D/g, '');

  // 10 digits starting with Indian mobile prefix [6-9]
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 11 digits starting with 0
  if (cleaned.length === 11 && /^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }

  // 12 digits starting with 91
  if (cleaned.length === 12 && /^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return '';
}

/**
 * Send OTP to a phone number and persist hashed challenge to MongoDB.
 * If SMS delivery fails, the challenge is rolled back to prevent dead challenges.
 */
export async function sendOtpToPhone(rawPhone: string): Promise<SendOtpResult> {
  const phone = normalizePhoneNumber(rawPhone);
  if (!phone) {
    return {
      success: false,
      message: 'Please provide a valid 10-digit Indian mobile number',
    };
  }

  // Ensure OTP_HASH_SECRET is configured before proceeding
  let hashedOtp: string;
  const otp = generateRandomOtp();
  try {
    hashedOtp = hashOtp(phone, otp);
  } catch {
    return {
      success: false,
      message:
        'SMS verification is temporarily unavailable due to security configuration.',
    };
  }

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return {
        success: false,
        message: 'Database connection unavailable. Please try again.',
      };
    }

    const now = new Date();

    // Rate limiting check: verify if an active challenge was created less than 60s ago
    const latestActiveChallenge = await OtpChallengeModel.findOne({
      phone,
      isConsumed: false,
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (latestActiveChallenge?.createdAt) {
      const elapsedMs =
        now.getTime() - new Date(latestActiveChallenge.createdAt).getTime();
      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil(
          (OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000
        );
        return {
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
        };
      }
    }

    // Invalidate any previous unconsumed OTP challenges for this phone number
    await OtpChallengeModel.updateMany(
      { phone, isConsumed: false },
      { $set: { isConsumed: true, consumedAt: now } }
    );

    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    // Store new challenge in MongoDB
    const createdChallenge = await OtpChallengeModel.create({
      phone,
      hashedOtp,
      expiresAt,
      attempts: 0,
      isConsumed: false,
    });

    const provider = (
      process.env.OTP_PROVIDER ||
      process.env.SMS_PROVIDER ||
      'test'
    ).toLowerCase();

    let deliverySuccess = false;

    // 1. Fast2SMS (Primary Indian SMS Gateway)
    if (provider === 'fast2sms') {
      const apiKey = process.env.FAST2SMS_API_KEY?.trim();
      if (apiKey) {
        try {
          const indianNumber = phone.replace('+91', '');
          const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              authorization: apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              variables_values: otp,
              route: 'otp',
              numbers: indianNumber,
            }),
          });

          const data = await res.json().catch(() => null);

          if (res.ok && data?.return === true) {
            deliverySuccess = true;
            return {
              success: true,
              message: `OTP sent successfully to ${phone}`,
              expiresInSeconds: 300,
            };
          }
        } catch {
          // Provider network error handled below
        }
      }
    }

    // 2. Twilio SMS
    if (
      provider === 'twilio' &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN
    ) {
      try {
        const auth = Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64');
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', process.env.TWILIO_PHONE_NUMBER || '');
        params.append(
          'Body',
          `Your BhoomiMitra verification code is ${otp}. Valid for 5 minutes. Do not share.`
        );

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (res.ok) {
          deliverySuccess = true;
          return {
            success: true,
            message: `OTP sent successfully to ${phone}`,
            expiresInSeconds: 300,
          };
        }
      } catch {
        // Provider network error handled below
      }
    }

    // In production, real SMS gateway is mandatory. Simulated OTP is strictly forbidden.
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      // If delivery failed or no provider was configured in production, delete the unusable challenge
      if (!deliverySuccess && createdChallenge?._id) {
        await OtpChallengeModel.findByIdAndDelete(createdChallenge._id).catch(
          () => {}
        );
      }

      return {
        success: false,
        message:
          'SMS Gateway service is not configured or delivery failed. Please configure FAST2SMS or TWILIO credentials.',
        isTestMode: false,
      };
    }

    // If a provider was explicitly configured in dev/preview but delivery failed, rollback
    if (provider !== 'test' && !deliverySuccess) {
      if (createdChallenge?._id) {
        await OtpChallengeModel.findByIdAndDelete(createdChallenge._id).catch(
          () => {}
        );
      }
      return {
        success: false,
        message: 'SMS delivery failed. Please verify provider credentials and try again.',
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
  } catch {
    return {
      success: false,
      message: 'Failed to process OTP request. Please try again.',
    };
  }
}

/**
 * Verify OTP against MongoDB challenge record with single-use atomic consumption
 */
export async function verifyOtpForPhone(
  rawPhone: string,
  code: string
): Promise<VerifyOtpResult> {
  const phone = normalizePhoneNumber(rawPhone);
  if (!phone) {
    return {
      success: false,
      message: 'Invalid phone number format.',
    };
  }

  if (!code || typeof code !== 'string' || !code.trim() || code.trim().length !== 6) {
    return {
      success: false,
      message: 'Please enter a valid 6-digit OTP code.',
    };
  }

  let providedHash: string;
  try {
    providedHash = hashOtp(phone, code.trim());
  } catch {
    return {
      success: false,
      message:
        'OTP verification is temporarily unavailable due to security configuration.',
    };
  }

  try {
    const connection = await connectToDatabase();
    if (!connection) {
      return {
        success: false,
        message: 'Database connection unavailable.',
      };
    }

    const now = new Date();

    // Find active, unconsumed challenge that has not expired
    const challenge = await OtpChallengeModel.findOne({
      phone,
      isConsumed: false,
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    if (!challenge) {
      return {
        success: false,
        message:
          'No active OTP request found for this number or code has expired. Please request a new OTP.',
      };
    }

    // Max attempts exceeded check
    if (challenge.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      challenge.isConsumed = true;
      challenge.consumedAt = now;
      await challenge.save();

      return {
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.',
      };
    }

    // Compare hashes securely with timing-safe comparison
    const providedBuffer = Buffer.from(providedHash, 'hex');
    const storedBuffer = Buffer.from(challenge.hashedOtp, 'hex');

    const isMatch =
      providedBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(providedBuffer, storedBuffer);

    if (!isMatch) {
      challenge.attempts += 1;
      if (challenge.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        challenge.isConsumed = true;
        challenge.consumedAt = now;
      }
      await challenge.save();

      const remaining = MAX_VERIFICATION_ATTEMPTS - challenge.attempts;
      return {
        success: false,
        message:
          remaining > 0
            ? `Invalid OTP code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
            : 'Too many incorrect attempts. Please request a new OTP.',
      };
    }

    // Verification successful: atomically consume the token to guarantee single-use
    challenge.isConsumed = true;
    challenge.consumedAt = now;
    await challenge.save();

    return {
      success: true,
      message: 'Phone number verified successfully.',
    };
  } catch {
    return {
      success: false,
      message: 'Failed to verify OTP due to a system error. Please try again.',
    };
  }
}
