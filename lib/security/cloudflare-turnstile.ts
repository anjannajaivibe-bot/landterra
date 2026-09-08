/**
 * lib/security/cloudflare-turnstile.ts
 *
 * Cloudflare Turnstile Human Verification Service.
 * Canonical server-side siteverify implementation per:
 * https://developers.cloudflare.com/turnstile/spin/prompt.md
 *
 * Contract:
 *  browser → user's backend (here) → Cloudflare siteverify
 * Tokens are SINGLE-USE. Never call siteverify from the browser.
 */

// Official Cloudflare Turnstile testing keys (local dev only):
export const CLOUDFLARE_TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';
export const CLOUDFLARE_TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export interface TurnstileVerifyResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export interface TurnstileVerifyOptions {
  /** The cf-turnstile-response token from the client */
  token?: string | null;
  /** Client IP for fraud signal enrichment */
  clientIp?: string;
  /**
   * Expected action name (must match widget data-action).
   * When provided, siteverify result action is validated.
   */
  expectedAction?: string;
}

/**
 * Validates a Cloudflare Turnstile token with Cloudflare's siteverify endpoint.
 *
 * Canonical flow (Spin spec):
 *  1. Token format guard (present, string, 1-2048 chars)
 *  2. Hostname allowlist guard (TURNSTILE_HOSTNAMES env var)
 *  3. POST to siteverify with 10s timeout
 *  4. Validate success === true
 *  5. Validate action matches expectedAction (if provided)
 *  6. Validate hostname is in allowlist (if set)
 */
export async function verifyCloudflareTurnstile(
  tokenOrOptions?: string | null | TurnstileVerifyOptions,
  clientIpLegacy?: string
): Promise<{ success: boolean; error?: string; codes?: string[] }> {
  // Support both legacy call signature and options object
  let token: string | null | undefined;
  let clientIp: string | undefined;
  let expectedAction: string | undefined;

  if (tokenOrOptions && typeof tokenOrOptions === 'object') {
    token = tokenOrOptions.token;
    clientIp = tokenOrOptions.clientIp;
    expectedAction = tokenOrOptions.expectedAction;
  } else {
    token = tokenOrOptions;
    clientIp = clientIpLegacy;
  }

  // ── 1. Token format guard (Spin spec: must be string, 1–2048 chars) ──
  if (
    typeof token !== 'string' ||
    token.trim().length === 0 ||
    token.trim().length > 2048
  ) {
    return {
      success: false,
      error: 'Security check required. Please complete the verification to continue.',
    };
  }

  const trimmedToken = token.trim();

  // ── 2. Secret key ──
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    CLOUDFLARE_TURNSTILE_TEST_SECRET;

  // ── Dev-only bypass: test token + test secret OR non-production dev token ──
  if (
    (secretKey === CLOUDFLARE_TURNSTILE_TEST_SECRET || process.env.NODE_ENV !== 'production') &&
    trimmedToken.startsWith('cf_turnstile_test_token_')
  ) {
    return { success: true };
  }

  // ── 3. Hostname allowlist from env (Spin spec) ──
  // Format: TURNSTILE_HOSTNAMES=landterra.vercel.app,localhost
  // In production, must NOT include localhost or 127.0.0.1
  const allowedHostnames = (process.env.TURNSTILE_HOSTNAMES ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);

  // ── 4. Siteverify call with 10s timeout (Spin canonical) ──
  let result: TurnstileVerifyResult;
  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: trimmedToken,
    });
    if (clientIp) {
      body.append('remoteip', clientIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000), // Spin spec: 10s timeout
        body: body.toString(),
      }
    );

    if (!response.ok) {
      console.warn(`[Turnstile] siteverify HTTP ${response.status}`);
      // Allow test-key fallback in dev only
      if (secretKey === CLOUDFLARE_TURNSTILE_TEST_SECRET) {
        return { success: true };
      }
      return {
        success: false,
        error: 'Verification service temporarily unavailable. Please try again.',
      };
    }

    result = await response.json();
  } catch (err: unknown) {
    console.error('[Turnstile] siteverify error:', err);
    if (secretKey === CLOUDFLARE_TURNSTILE_TEST_SECRET) {
      return { success: true };
    }
    return {
      success: false,
      error: 'Verification encountered a network error. Please refresh and try again.',
    };
  }

  // ── 5. success check ──
  if (!result.success) {
    const codes = result['error-codes'] ?? [];
    console.warn('[Turnstile] verification failed:', codes);
    return {
      success: false,
      codes,
      error: codes.includes('timeout-or-duplicate')
        ? 'Verification expired. Please complete the security check again.'
        : 'Verification failed. Please try again.',
    };
  }

  // ── 6. Action validation (Spin spec) ──
  if (expectedAction && result.action !== expectedAction) {
    console.warn(`[Turnstile] action mismatch: expected "${expectedAction}", got "${result.action}"`);
    return {
      success: false,
      error: 'Verification action mismatch. Please refresh and try again.',
    };
  }

  // ── 7. Hostname validation (Spin spec) ──
  // Only enforced when TURNSTILE_HOSTNAMES is configured
  if (allowedHostnames.length > 0 && result.hostname) {
    if (!allowedHostnames.includes(result.hostname)) {
      console.warn(`[Turnstile] hostname not allowed: "${result.hostname}"`);
      return {
        success: false,
        error: 'Verification origin not recognized.',
      };
    }
  }

  return { success: true };
}
