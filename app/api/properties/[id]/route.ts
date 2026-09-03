import {
  NextRequest,
  NextResponse,
} from 'next/server';

import {
  getPropertyById,
  updateProperty,
  deleteProperty,
} from '@/services/property.service';

import {
  getSession,
  requireAuth,
} from '@/lib/security/auth';

import {
  getPublicMapCoordinates,
} from '@/lib/maps/client';

import {
  UpdatePropertySchema,
} from '@/lib/validation/property';

import {
  IAuthenticatedProperty,
  IPublicProperty,
  IProperty,
} from '@/types/property';

/* ================================================================
   PUBLIC PROPERTY SERIALIZER
================================================================ */

function toPublicProperty(
  property: IProperty,
): IPublicProperty {
  const publicProperty: IPublicProperty = {
    _id:
      property._id,

    title:
      property.title,

    description:
      property.description,

    landAreaYards:
      property.landAreaYards,

    pricePerYard:
      property.pricePerYard,

    totalPrice:
      property.totalPrice,

    priceNegotiable:
      property.priceNegotiable,

    landType:
      property.landType,

    propertyType:
      property.propertyType,

    bhk:
      property.bhk,

    facing:
      property.facing,

    floorNumber:
      property.floorNumber,

    totalFloors:
      property.totalFloors,

    furnishingStatus:
      property.furnishingStatus,

    bathrooms:
      property.bathrooms,

    balconies:
      property.balconies,

    carpetAreaSqFt:
      property.carpetAreaSqFt,

    superBuiltUpAreaSqFt:
      property.superBuiltUpAreaSqFt,

    boundaryWall:
      property.boundaryWall,

    cornerPlot:
      property.cornerPlot,

    gatedCommunity:
      property.gatedCommunity,

    amenities:
      property.amenities,

    approvals:
      property.approvals,

    waterSource:
      property.waterSource,

    electricityPhase:
      property.electricityPhase,

    soilType:
      property.soilType,

    propertyAttributes:
      property.propertyAttributes,

    roadAccess:
      property.roadAccess,

    nearbyLandmarks:
      property.nearbyLandmarks,

    location:
      property.location,

    googleMapsShareLink:
      property.googleMapsShareLink,

    approximateLocation:
      property.approximateLocation,

    verificationStatus:
      property.verificationStatus,

    listingStatus:
      property.listingStatus,

    images:
      property.images,

    publishedAt:
      property.publishedAt,

    createdAt:
      property.createdAt,

    updatedAt:
      property.updatedAt,

    viewsCount:
      property.viewsCount,
  };

  /*
   * Never expose private document records.
   */

  delete (
    publicProperty as Partial<IPublicProperty> &
    Record<string, unknown>
  ).documents;

  return publicProperty;
}

/* ================================================================
   AUTHENTICATED PROPERTY VIEW
================================================================ */

function toOwnerProperty(
  property: IProperty,
): IAuthenticatedProperty {
  return {
    ...toPublicProperty(property),
    documents: property.documents,
    governmentRegistrationId: property.governmentRegistrationId,
    publishingFee: property.publishingFee,
    monthlyListingFee: property.monthlyListingFee,
    paymentStatus: property.paymentStatus,
    subscriptionStartedAt: property.subscriptionStartedAt,
    subscriptionExpiresAt: property.subscriptionExpiresAt,
    rejectionReason: property.rejectionReason,
    sellerName:
      property.sellerName,

    sellerType:
      property.sellerType,

    sellerPhone:
      property.sellerPhone,

    sellerEmail:
      property.sellerEmail,

    inquiriesCount:
      property.inquiriesCount,
  };
}

/* ================================================================
   GET PROPERTY
================================================================ */

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const {
      id,
    } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            'Property ID is required.',
        },
        {
          status: 400,
        },
      );
    }

    const property =
      await getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        {
          error:
            'Property not found.',
        },
        {
          status: 404,
        },
      );
    }

    const session =
      await getSession(req);

    const isOwner =
      session?.user?.id ===
      property.sellerId;

    const isAdmin =
      session?.user?.role ===
      'ADMIN';

    /*
     * Owner/admin can receive the authenticated
     * property representation.
     */

    if (isOwner || isAdmin) {
      const privateProperty =
        toOwnerProperty(property);

      return NextResponse.json(
        {
          property:
            privateProperty,

          isOwner,

          isAdmin,
        },
        {
          status: 200,
        },
      );
    }

    /*
     * Everyone else receives ONLY the public representation.
     */

    const publicProperty =
      toPublicProperty(property);

    /*
     * Exact coordinates are only transformed when
     * approximateLocation is enabled.
     */

    if (
      property.approximateLocation &&
      property.latitude !== undefined &&
      property.longitude !== undefined
    ) {
      const publicCoords =
        getPublicMapCoordinates(
          property.latitude,
          property.longitude,
          true,
        );

      /*
       * We deliberately add coordinates only to
       * this response object.
       */

      return NextResponse.json(
        {
          property: {
            ...publicProperty,

            latitude:
              publicCoords.lat,

            longitude:
              publicCoords.lng,
          },

          isOwner: false,
        },
        {
          status: 200,
        },
      );
    }

    /*
     * If exact coordinates are not supposed to be public,
     * don't send them at all.
     */

    return NextResponse.json(
      {
        property:
          publicProperty,

        isOwner: false,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      'Get property error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Failed to load property.',
      },
      {
        status: 500,
      },
    );
  }
}

/* ================================================================
   PATCH PROPERTY
================================================================ */

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const authUser =
    await requireAuth(req);

  if (
    authUser instanceof NextResponse
  ) {
    return authUser;
  }

  const {
    id,
  } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error:
          'Property ID is required.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const existing =
      await getPropertyById(id);

    if (!existing) {
      return NextResponse.json(
        {
          error:
            'Property not found.',
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Only the property owner or admin can edit.
     */

    const isOwner =
      authUser.id ===
      existing.sellerId;

    const isAdmin =
      authUser.role ===
      'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Forbidden. You do not own this listing.',
        },
        {
          status: 403,
        },
      );
    }

    const body =
      await req.json();

    const validated =
      UpdatePropertySchema.parse(
        body,
      );

    /*
     * Identity fields are never writable through this endpoint.
     *
     * Even if somebody manually sends them in the request,
     * they are discarded.
     */

    const safeUpdate: Record<string, unknown> = {
      ...validated,
    };

    delete safeUpdate.sellerName;
    delete safeUpdate.sellerEmail;
    delete safeUpdate.sellerPhone;
    delete safeUpdate.sellerType;
    delete safeUpdate.sellerId;

    delete safeUpdate.paymentStatus;
    if (safeUpdate.listingStatus !== 'PAUSED' && safeUpdate.listingStatus !== 'PUBLISHED') {
      delete safeUpdate.listingStatus;
    }
    delete safeUpdate.verificationStatus;
    delete safeUpdate.publishingFee;
    delete safeUpdate.monthlyListingFee;
    delete safeUpdate.totalPrice;
    delete safeUpdate.subscriptionStartedAt;
    delete safeUpdate.subscriptionExpiresAt;
    delete safeUpdate.publishedAt;
    delete safeUpdate.viewsCount;
    delete safeUpdate.inquiriesCount;
    delete safeUpdate.rejectionReason;
    delete safeUpdate.verificationReviewedAt;
    delete safeUpdate.verificationReviewedBy;

    const updated =
      await updateProperty(
        id,
        safeUpdate,
      );

    if (!updated) {
      return NextResponse.json(
        {
          error:
            'Property could not be updated.',
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        property:
          isOwner || isAdmin
            ? toOwnerProperty(
              updated,
            )
            : toPublicProperty(
              updated,
            ),
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error(
      'Update property error:',
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
            : 'Failed to update property.',
      },
      {
        status: 400,
      },
    );
  }
}

/* ================================================================
   DELETE PROPERTY
================================================================ */

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const authUser =
    await requireAuth(req);

  if (
    authUser instanceof NextResponse
  ) {
    return authUser;
  }

  const {
    id,
  } = await params;

  if (!id) {
    return NextResponse.json(
      {
        error:
          'Property ID is required.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const existing =
      await getPropertyById(id);

    if (!existing) {
      return NextResponse.json(
        {
          error:
            'Property not found.',
        },
        {
          status: 404,
        },
      );
    }

    const isOwner =
      authUser.id ===
      existing.sellerId;

    const isAdmin =
      authUser.role ===
      'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Forbidden. You do not own this listing.',
        },
        {
          status: 403,
        },
      );
    }

    await deleteProperty(id);

    return NextResponse.json(
      {
        success: true,

        message:
          'Property listing deleted.',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      'Delete property error:',
      error,
    );

    return NextResponse.json(
      {
        error:
          'Failed to delete property.',
      },
      {
        status: 500,
      },
    );
  }
}