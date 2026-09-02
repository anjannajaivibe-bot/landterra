import {
    NextRequest,
    NextResponse,
} from 'next/server';

import crypto from 'crypto';

import { UserModel } from '@/models/User';
import { connectToDatabase } from '@/lib/db/mongodb';
import { setSessionCookie } from '@/lib/security/auth';

/* ================================================================
   CONSTANTS
================================================================ */

const GOOGLE_TOKEN_ENDPOINT =
    'https://oauth2.googleapis.com/token';

const GOOGLE_USERINFO_ENDPOINT =
    'https://www.googleapis.com/oauth2/v3/userinfo';

const OAUTH_STATE_COOKIE =
    'landterra_google_oauth_state';

const OAUTH_REDIRECT_COOKIE =
    'landterra_google_redirect';

/* ================================================================
   HELPERS
================================================================ */

function safeRedirect(
    value: string | undefined,
): string {
    if (!value) {
        return '/';
    }

    const decoded =
        decodeURIComponent(value);

    if (
        decoded.startsWith('/') &&
        !decoded.startsWith('//')
    ) {
        return decoded;
    }

    return '/';
}

/* ================================================================
   GOOGLE TOKEN EXCHANGE
================================================================ */

async function exchangeCodeForToken(
    code: string,
    redirectUri: string,
) {
    const clientId =
        process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
        process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            'Google OAuth credentials are not configured.',
        );
    }

    const response =
        await fetch(
            GOOGLE_TOKEN_ENDPOINT,
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded',
                },

                body:
                    new URLSearchParams({
                        code,

                        client_id:
                            clientId,

                        client_secret:
                            clientSecret,

                        redirect_uri:
                            redirectUri,

                        grant_type:
                            'authorization_code',
                    }),

                cache: 'no-store',
            },
        );

    if (!response.ok) {
        const body =
            await response.text();

        console.error(
            'Google token exchange failed:',
            body,
        );

        throw new Error(
            'Google authentication could not be completed.',
        );
    }

    return response.json() as Promise<{
        access_token: string;
        token_type?: string;
        expires_in?: number;
        scope?: string;
        id_token?: string;
    }>;
}

/* ================================================================
   GOOGLE USER PROFILE
================================================================ */

async function getGoogleProfile(
    accessToken: string,
) {
    const response =
        await fetch(
            GOOGLE_USERINFO_ENDPOINT,
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,
                },

                cache: 'no-store',
            },
        );

    if (!response.ok) {
        throw new Error(
            'Unable to retrieve your Google profile.',
        );
    }

    const profile =
        await response.json();

    /*
     * Google "sub" is the stable Google account identifier.
     */

    if (
        !profile.sub ||
        !profile.email
    ) {
        throw new Error(
            'Google did not provide the required account information.',
        );
    }

    /*
     * Only accept a Google-verified email.
     */

    if (
        profile.email_verified !== true
    ) {
        throw new Error(
            'Your Google email address must be verified.',
        );
    }

    return {
        googleId:
            String(profile.sub),

        email:
            String(profile.email)
                .trim()
                .toLowerCase(),

        name:
            String(
                profile.name ||
                profile.email.split('@')[0],
            ).trim(),

        picture:
            typeof profile.picture ===
                'string'
                ? profile.picture
                : '',
    };
}

/* ================================================================
   FIND / CREATE USER
================================================================ */

async function findOrCreateUser(
    profile: {
        googleId: string;
        email: string;
        name: string;
        picture: string;
    },
) {
    const connection =
        await connectToDatabase();

    if (!connection) {
        throw new Error(
            'MongoDB database is not connected.',
        );
    }

    const adminEmails =
        (
            process.env.ADMIN_EMAILS ||
            ''
        )
            .split(',')
            .map((email) =>
                email.trim().toLowerCase(),
            )
            .filter(Boolean);

    const isAdmin =
        adminEmails.includes(
            profile.email,
        );

    /*
     * Search by Google ID first.
     *
     * Email is also checked to safely link an existing
     * BhoomiMitra account to its Google identity.
     */

    let user =
        await UserModel.findOne({
            $or: [
                {
                    googleId:
                        profile.googleId,
                },

                {
                    email:
                        profile.email,
                },
            ],
        });

    /* --------------------------------------------------------------
       CREATE
    -------------------------------------------------------------- */

    if (!user) {
        user =
            await UserModel.create({
                googleId:
                    profile.googleId,

                name:
                    profile.name,

                email:
                    profile.email,

                profileImage:
                    profile.picture,

                /*
                 * BUYER is the current database role for a normal
                 * customer account.
                 *
                 * It does NOT prevent that customer from selling.
                 *
                 * Seller eligibility is controlled by authentication +
                 * phone verification + listing workflow.
                 */

                role:
                    isAdmin
                        ? 'ADMIN'
                        : 'BUYER',

                sellerType:
                    'INDIVIDUAL',

                isActive:
                    true,

                isPhoneVerified:
                    false,

                isVerifiedSeller:
                    false,
            });

        return user;
    }

    /* --------------------------------------------------------------
       EXISTING USER
    -------------------------------------------------------------- */

    if (
        user.isActive === false
    ) {
        throw new Error(
            'Your BhoomiMitra account has been disabled. Please contact support.',
        );
    }

    /*
     * If the email belongs to a designated admin,
     * maintain ADMIN privileges.
     */

    if (
        isAdmin &&
        user.role !== 'ADMIN'
    ) {
        user.role = 'ADMIN';
    }

    /*
     * Associate the actual Google subject ID.
     */

    if (
        user.googleId !==
        profile.googleId
    ) {
        user.googleId =
            profile.googleId;
    }

    /*
     * Keep the Google profile information current.
     */

    if (
        profile.name &&
        profile.name !== user.name
    ) {
        user.name =
            profile.name;
    }

    if (
        profile.picture &&
        profile.picture !==
        user.profileImage
    ) {
        user.profileImage =
            profile.picture;
    }

    await user.save();

    return user;
}

/* ================================================================
   GET CALLBACK
================================================================ */

export async function GET(
    req: NextRequest,
) {
    const redirectCookie =
        req.cookies.get(
            OAUTH_REDIRECT_COOKIE,
        )?.value;

    const fallbackRedirect =
        safeRedirect(
            redirectCookie,
        );

    try {
        const code =
            req.nextUrl.searchParams.get(
                'code',
            );

        const returnedState =
            req.nextUrl.searchParams.get(
                'state',
            );

        const googleError =
            req.nextUrl.searchParams.get(
                'error',
            );

        /*
         * User cancelled Google login.
         */

        if (googleError) {
            const response =
                NextResponse.redirect(
                    new URL(
                        fallbackRedirect,
                        req.url,
                    ),
                );

            response.cookies.delete(
                OAUTH_STATE_COOKIE,
            );

            response.cookies.delete(
                OAUTH_REDIRECT_COOKIE,
            );

            return response;
        }

        if (!code || !returnedState) {
            return NextResponse.json(
                {
                    error:
                        'Invalid Google authentication response.',
                },
                { status: 400 },
            );
        }

        /* ------------------------------------------------------------
           VERIFY OAUTH STATE
        ------------------------------------------------------------- */

        const storedState =
            req.cookies.get(
                OAUTH_STATE_COOKIE,
            )?.value;

        if (
            !storedState ||
            storedState.length !==
            returnedState.length ||
            !crypto.timingSafeEqual(
                Buffer.from(
                    storedState,
                ),
                Buffer.from(
                    returnedState,
                ),
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        'Invalid or expired Google authentication request.',
                },
                { status: 400 },
            );
        }

        /* ------------------------------------------------------------
           CONFIG
        ------------------------------------------------------------- */

        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL;

        if (!appUrl) {
            throw new Error(
                'NEXT_PUBLIC_APP_URL is not configured.',
            );
        }

        const callbackUrl =
            `${appUrl.replace(/\/$/, '')}` +
            '/api/auth/google/callback';

        /* ------------------------------------------------------------
           EXCHANGE CODE
        ------------------------------------------------------------- */

        const token =
            await exchangeCodeForToken(
                code,
                callbackUrl,
            );

        if (!token.access_token) {
            throw new Error(
                'Google did not return an access token.',
            );
        }

        /* ------------------------------------------------------------
           GET REAL GOOGLE IDENTITY
        ------------------------------------------------------------- */

        const googleProfile =
            await getGoogleProfile(
                token.access_token,
            );

        /* ------------------------------------------------------------
           MONGODB
        ------------------------------------------------------------- */

        const user =
            await findOrCreateUser(
                googleProfile,
            );

        /* ------------------------------------------------------------
           REDIRECT TO ORIGINAL PAGE & SET SESSION COOKIE
        ------------------------------------------------------------- */

        const response =
            NextResponse.redirect(
                new URL(
                    fallbackRedirect,
                    req.url,
                ),
            );

        setSessionCookie(response, {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        });

        /* ------------------------------------------------------------
           CLEAN OAUTH COOKIES
        ------------------------------------------------------------- */

        response.cookies.delete(
            OAUTH_STATE_COOKIE,
        );

        response.cookies.delete(
            OAUTH_REDIRECT_COOKIE,
        );

        return response;
    } catch (error) {
        console.error(
            'Google OAuth callback error:',
            error,
        );

        const response =
            NextResponse.redirect(
                new URL(
                    `/contact?authError=${encodeURIComponent(
                        'Google authentication could not be completed. Please try again.',
                    )}`,
                    req.url,
                ),
            );

        response.cookies.delete(
            OAUTH_STATE_COOKIE,
        );

        response.cookies.delete(
            OAUTH_REDIRECT_COOKIE,
        );

        return response;
    }
}