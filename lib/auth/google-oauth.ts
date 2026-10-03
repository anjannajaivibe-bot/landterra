import { NextRequest } from 'next/server';

/**
 * Resolve Google OAuth settings without exposing credentials to the client.
 *
 * Canonical production names are GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
 * A few common aliases are accepted so older deployments can migrate safely.
 */
function firstConfigured(...values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));
}

export function getGoogleClientId() {
  return firstConfigured(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.AUTH_GOOGLE_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  );
}

export function getGoogleClientSecret() {
  return firstConfigured(
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.AUTH_GOOGLE_SECRET,
  );
}

export function isGoogleOAuthConfigured() {
  return Boolean(
    getGoogleClientId() &&
      getGoogleClientSecret(),
  );
}

export function getAppBaseUrl(req: NextRequest) {
  const configuredUrl = firstConfigured(
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  );

  const rawUrl =
    configuredUrl ||
    req.nextUrl.origin;

  try {
    const parsed = new URL(rawUrl);
    return parsed.origin;
  } catch {
    return req.nextUrl.origin;
  }
}

export function getGoogleCallbackUrl(
  req: NextRequest,
) {
  return (
    getAppBaseUrl(req) +
    '/api/auth/google/callback'
  );
}
