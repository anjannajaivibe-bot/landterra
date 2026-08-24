import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export function isResendConfigured(): boolean {
  return Boolean(RESEND_API_KEY && !RESEND_API_KEY.includes('123456789'));
}

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!isResendConfigured()) return null;

  if (!resendInstance) {
    resendInstance = new Resend(RESEND_API_KEY);
  }

  return resendInstance;
}
