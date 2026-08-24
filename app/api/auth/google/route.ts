import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

/* ================================================================
   CONSTANTS
================================================================ */

const GOOGLE_AUTH_ENDPOINT =
  'https://accounts.google.com/o/oauth2/v2/auth';

const SESSION_COOKIE = 'landterra_session';

const OAUTH_STATE_COOKIE =
  'landterra_google_oauth_state';

const OAUTH_REDIRECT_COOKIE =
  'landterra_google_redirect';

/* ================================================================
   GET
   Start Google OAuth
================================================================ */

export async function GET(req: NextRequest) {
  try {
    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId) {
      return NextResponse.json(
        {
          error:
            'Google authentication is not configured. Missing GOOGLE_CLIENT_ID.',
        },
        { status: 503 },
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        {
          error:
            'NEXT_PUBLIC_APP_URL is not configured.',
        },
        { status: 503 },
      );
    }

    /*
     * The customer can request to return to:
     *
     * /properties/123
     * /sell
     * /profile
     *
     * Never allow an external URL.
     */

    const requestedRedirect =
      req.nextUrl.searchParams.get(
        'redirect',
      ) || '/';

    const redirectUrl =
      requestedRedirect.startsWith('/') &&
        !requestedRedirect.startsWith('//')
        ? requestedRedirect
        : '/';

    /*
     * Cryptographically secure OAuth state.
     *
     * This protects against CSRF during OAuth.
     */

    const state =
      crypto.randomBytes(32).toString('hex');

    const callbackUrl =
      `${appUrl.replace(/\/$/, '')}` +
      '/api/auth/google/callback';

    const params =
      new URLSearchParams({
        client_id: clientId,

        redirect_uri: callbackUrl,

        response_type: 'code',

        scope:
          'openid email profile',

        state,

        prompt: 'select_account',
      });

    const googleAuthorizationUrl =
      `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

    const response =
      NextResponse.json({
        success: true,
        url: googleAuthorizationUrl,
      });

    /*
     * Store OAuth state server-side.
     *
     * HttpOnly means browser JavaScript cannot modify it.
     */

    response.cookies.set(
      OAUTH_STATE_COOKIE,
      state,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          'production',

        sameSite: 'lax',

        maxAge: 60 * 10,

        path: '/',
      },
    );

    /*
     * Store original destination.
     */

    response.cookies.set(
      OAUTH_REDIRECT_COOKIE,
      encodeURIComponent(
        redirectUrl,
      ),
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          'production',

        sameSite: 'lax',

        maxAge: 60 * 10,

        path: '/',
      },
    );

    return response;
  } catch (error) {
    console.error(
      'Google OAuth start error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Unable to start Google authentication.',
      },
      { status: 500 },
    );
  }
}

/* ================================================================
   POST

   Intentionally disabled.

   The old application accepted:
   email
   name
   googleId
   picture

   from the browser.

   That was not real authentication.
================================================================ */

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Direct Google identity submission is not supported. Use the Google OAuth flow.',
    },
    {
      status: 405,
      headers: {
        Allow: 'GET',
      },
    },
  );
}