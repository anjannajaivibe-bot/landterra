import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  CreatePropertySchema,
} from '@/lib/validation/property';

import {
  getProperties,
  createProperty,
} from '@/services/property.service';

import {
  requireAuth,
} from '@/lib/security/auth';

import {
  checkRateLimit,
} from '@/lib/security/rate-limit';

import {
  PropertyFilterParams,
} from '@/types/property';

import {
  getPlatformSettings,
} from '@/services/settings.service';

/* ================================================================
   HELPERS
================================================================ */

function parsePositiveNumber(
  value: string | null,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return Math.min(parsed, max);
}

/* ================================================================
   GET
   PUBLIC MARKETPLACE SEARCH
================================================================ */

export async function GET(
  req: NextRequest,
) {
  const forwardedFor =
    req.headers.get('x-forwarded-for');

  const ip =
    forwardedFor?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const {
    allowed,
  } = checkRateLimit(ip, 120);

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          'Rate limit exceeded. Please slow down.',
      },
      {
        status: 429,
      },
    );
  }

  try {
    const {
      searchParams,
    } = new URL(req.url);

    /*
     * IMPORTANT:
     *
     * Public marketplace queries must never be able to
     * request private lifecycle states such as DRAFT,
     * PAYMENT_PENDING, EXPIRED, REJECTED, or DELETED.
     *
     * The public API always queries marketplace-visible
     * listings.
     */

    const isSellerOnly = searchParams.get('sellerOnly') === 'true';
    let sellerUserId: string | undefined = undefined;

    if (isSellerOnly) {
      const authUser = await requireAuth(req);
      if (authUser instanceof NextResponse) {
        return authUser;
      }
      sellerUserId = authUser.id;
    }

    const requestedStatus = searchParams.get('listingStatus');

    const filters: PropertyFilterParams = {
      query:
        searchParams.get('query') ||
        undefined,

      city:
        searchParams.get('city') ||
        undefined,

      state:
        searchParams.get('state') ||
        undefined,

      minPrice:
        parsePositiveNumber(
          searchParams.get('minPrice'),
        ),

      maxPrice:
        parsePositiveNumber(
          searchParams.get('maxPrice'),
        ),

      minArea:
        parsePositiveNumber(
          searchParams.get('minArea'),
        ),

      maxArea:
        parsePositiveNumber(
          searchParams.get('maxArea'),
        ),

      minPricePerYard:
        parsePositiveNumber(
          searchParams.get(
            'minPricePerYard',
          ),
        ),

      maxPricePerYard:
        parsePositiveNumber(
          searchParams.get(
            'maxPricePerYard',
          ),
        ),

      landType:
        (searchParams.get(
          'landType',
        ) as PropertyFilterParams['landType']) ||
        undefined,

      propertyType:
        searchParams.get('propertyType') ||
        undefined,

      bhk:
        searchParams.get('bhk') ||
        undefined,

      verifiedOnly:
        searchParams.get(
          'verifiedOnly',
        ) === 'true',

      sortBy:
        (searchParams.get(
          'sortBy',
        ) as PropertyFilterParams['sortBy']) ||
        'newest',

      page:
        parsePositiveInteger(
          searchParams.get('page'),
          1,
          100000,
        ),

      limit:
        parsePositiveInteger(
          searchParams.get('limit'),
          12,
          50,
        ),

      sellerId: sellerUserId,

      listingStatus: isSellerOnly
        ? ((requestedStatus as any) || 'ALL')
        : 'PUBLISHED',

      verificationStatus:
        undefined,

      publicOnly: !isSellerOnly,
    };

    /*
     * If the customer explicitly requests verified-only,
     * enforce VERIFIED rather than relying only on UI state.
     */

    if (filters.verifiedOnly) {
      filters.verificationStatus =
        'VERIFIED';
    }

    const result =
      await getProperties(filters);

    return NextResponse.json(
      result,
      {
        status: 200,
        headers: {
          'Cache-Control':
            'private, no-cache, no-store, must-revalidate',
        },
      },
    );
  } catch (error: unknown) {
    console.error(
      'Public property search error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Failed to fetch properties.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ================================================================
   POST
   CREATE PROPERTY LISTING
================================================================ */

export async function POST(
  req: NextRequest,
) {
  /*
   * Authenticate FIRST.
   */

  const authUser =
    await requireAuth(req);

  if (
    authUser instanceof NextResponse
  ) {
    return authUser;
  }

  try {
    /*
     * Platform rules are checked only after authentication.
     */

    const settings =
      await getPlatformSettings();

    /*
     * Phone verification gate.
     */

    if (
      settings.requirePhoneOtp &&
      !authUser.isPhoneVerified
    ) {
      return NextResponse.json(
        {
          error:
            'Phone verification is required before listing land. Please verify your mobile number with OTP.',
          code:
            'PHONE_VERIFICATION_REQUIRED',
        },
        {
          status: 403,
        },
      );
    }

    const body =
      await req.json();

    const validatedData =
      CreatePropertySchema.parse(
        body,
      );

    /*
     * IMPORTANT:
     *
     * Identity belongs to the authenticated account.
     *
     * Do NOT trust sellerName, sellerEmail or sellerPhone
     * supplied by the browser.
     */

    const property =
      await createProperty({
        ...validatedData,

        sellerId:
          authUser.id,

        sellerName:
          authUser.name,

        sellerEmail:
          authUser.email,

        /*
         * If phone verification is required, the phone
         * must come from the authenticated account.
         *
         * If phone verification is optional, this can
         * remain undefined.
         */

        sellerPhone:
          authUser.isPhoneVerified
            ? authUser.phone
            : undefined,

        sellerType:
          authUser.sellerType ||
          'INDIVIDUAL',
      });

    return NextResponse.json(
      {
        success: true,

        message:
          'Listing draft created. Please proceed to publishing fee payment.',

        property,
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error(
      'Create property error:',
      error,
    );

    if (
      error &&
      typeof error === 'object' &&
      'issues' in error
    ) {
      const zodIssues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
      const formattedMessage = zodIssues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join('; ');

      return NextResponse.json(
        {
          error: formattedMessage || 'Validation failed.',
          details: zodIssues,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create listing.',
      },
      {
        status: 500,
      },
    );
  }
}