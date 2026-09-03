import {
  IProperty,
  ListingStatus,
} from '@/types/property';

import { PropertyModel } from '@/models/Property';
import { connectToDatabase } from '@/lib/db/mongodb';

import {
  getPropertyById,
} from '@/services/property.service';

import {
  notifyVerificationResult,
} from '@/services/email.service';

import {
  createAuditLog,
} from '@/services/audit.service';

export interface VerifyActionPayload {
  propertyId: string;

  action:
    | 'APPROVE'
    | 'REJECT'
    | 'REQUEST_INFO'
    | 'SUSPEND';

  rejectionReason?: string;

  adminNotes?: string;

  adminUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/* ================================================================
   PROPERTY VERIFICATION
================================================================ */

export async function executePropertyVerification(
  payload: VerifyActionPayload,
): Promise<IProperty> {
  const {
    propertyId,
    action,
    rejectionReason,
    adminNotes,
    adminUser,
  } = payload;

  const property =
    await getPropertyById(propertyId);

  if (!property) {
    throw new Error(
      'Property not found.',
    );
  }

  /* --------------------------------------------------------------
     ADMIN APPROVAL
  -------------------------------------------------------------- */

  if (action === 'APPROVE') {
    return approveProperty(
      property,
      adminUser,
      adminNotes,
    );
  }

  /* --------------------------------------------------------------
     REJECTION
  -------------------------------------------------------------- */

  if (action === 'REJECT') {
    return rejectProperty(
      property,
      adminUser,
      rejectionReason,
      adminNotes,
    );
  }

  /* --------------------------------------------------------------
     REQUEST MORE INFORMATION
  -------------------------------------------------------------- */

  if (action === 'REQUEST_INFO') {
    return requestPropertyInformation(
      property,
      adminUser,
      adminNotes,
    );
  }

  /* --------------------------------------------------------------
     SUSPEND
  -------------------------------------------------------------- */

  if (action === 'SUSPEND') {
    return suspendProperty(
      property,
      adminUser,
      adminNotes,
    );
  }

  throw new Error(
    'Unsupported verification action.',
  );
}

/* ================================================================
   APPROVE
================================================================ */

async function approveProperty(
  property: IProperty,
  adminUser: VerifyActionPayload['adminUser'],
  adminNotes?: string,
): Promise<IProperty> {
  const now = new Date();

  /*
   * IMPORTANT:
   *
   * Verification and payment are separate.
   *
   * Admin approval alone must NEVER make an unpaid
   * property publicly visible.
   */

  const hasPaid =
    property.paymentStatus === 'PAID' ||
    property.isFeePaid === true;

  const newListingStatus: ListingStatus =
    hasPaid
      ? 'PUBLISHED'
      : 'PAYMENT_PENDING';

  const updates: Record<string, unknown> = {
    verificationStatus: 'VERIFIED',

    listingStatus:
      newListingStatus,

    verificationReviewedAt:
      now,

    verificationReviewedBy:
      adminUser.id,

    rejectionReason:
      undefined,

    publishedAt:
      hasPaid
        ? property.publishedAt || now
        : property.publishedAt,

    updatedAt: now,
  };

  /*
   * Only mark documents VERIFIED when admin approves.
   */

  if (property.documents?.length) {
    updates.documents =
      property.documents.map(
        (document) => ({
          ...document,

          verificationStatus:
            'VERIFIED',

          reviewedAt:
            now,

          reviewedBy:
            adminUser.id,

          rejectionReason:
            undefined,
        }),
      );
  }

  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection failed.');
  }

  const updated = await PropertyModel.findByIdAndUpdate(
    property._id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!updated) {
    throw new Error(
      'Failed to update property verification state.',
    );
  }

  const updatedProperty = updated as unknown as IProperty;

  /* --------------------------------------------------------------
     EMAIL
  -------------------------------------------------------------- */

  if (property.sellerEmail) {
    await notifyVerificationResult(
      property.sellerEmail,
      property.sellerName ||
        'Seller',
      property.title,
      'VERIFIED',
    );
  }

  /* --------------------------------------------------------------
     AUDIT
  -------------------------------------------------------------- */

  await createAuditLog({
    actorId: adminUser.id,

    actorName: adminUser.name,

    actorEmail: adminUser.email,

    actorRole: adminUser.role,

    action:
      'PROPERTY_VERIFICATION_APPROVE',

    entityType: 'PROPERTY',

    entityId: property._id,

    metadata: {
      previousVerificationStatus:
        property.verificationStatus,

      newVerificationStatus:
        'VERIFIED',

      previousListingStatus:
        property.listingStatus,

      newListingStatus,

      paymentStatus:
        property.paymentStatus,

      isFeePaid:
        property.isFeePaid,

      published:
        hasPaid,

      adminNotes,
    },
  });

  return updatedProperty;
}

/* ================================================================
   REJECT
================================================================ */

async function rejectProperty(
  property: IProperty,
  adminUser: VerifyActionPayload['adminUser'],
  rejectionReason?: string,
  adminNotes?: string,
): Promise<IProperty> {
  if (
    !rejectionReason ||
    rejectionReason.trim().length < 5
  ) {
    throw new Error(
      'A detailed rejection reason is required when rejecting a listing.',
    );
  }

  const now = new Date();

  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection failed.');
  }

  const updated = await PropertyModel.findByIdAndUpdate(
    property._id,
    {
      $set: {
        verificationStatus: 'REJECTED',
        listingStatus: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        verificationReviewedAt: now,
        verificationReviewedBy: adminUser.id,
        updatedAt: now,
      },
    },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!updated) {
    throw new Error(
      'Failed to reject property.',
    );
  }

  const updatedProperty = updated as unknown as IProperty;

  if (property.sellerEmail) {
    await notifyVerificationResult(
      property.sellerEmail,
      property.sellerName ||
        'Seller',
      property.title,
      'REJECTED',
      rejectionReason,
    );
  }

  await createAuditLog({
    actorId: adminUser.id,

    actorName: adminUser.name,

    actorEmail: adminUser.email,

    actorRole: adminUser.role,

    action:
      'PROPERTY_VERIFICATION_REJECT',

    entityType: 'PROPERTY',

    entityId: property._id,

    metadata: {
      rejectionReason,
      adminNotes,

      previousVerificationStatus:
        property.verificationStatus,

      previousListingStatus:
        property.listingStatus,

      newVerificationStatus:
        'REJECTED',

      newListingStatus:
        'REJECTED',
    },
  });

  return updatedProperty;
}

/* ================================================================
   REQUEST INFORMATION
================================================================ */

async function requestPropertyInformation(
  property: IProperty,
  adminUser: VerifyActionPayload['adminUser'],
  adminNotes?: string,
): Promise<IProperty> {
  const now = new Date();

  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection failed.');
  }

  const updated = await PropertyModel.findByIdAndUpdate(
    property._id,
    {
      $set: {
        verificationStatus: 'VERIFICATION_REQUIRED',
        verificationReviewedAt: now,
        verificationReviewedBy: adminUser.id,
        rejectionReason: adminNotes?.trim(),
        updatedAt: now,
      },
    },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!updated) {
    throw new Error(
      'Failed to request additional information.',
    );
  }

  const updatedProperty = updated as unknown as IProperty;

  if (property.sellerEmail) {
    await notifyVerificationResult(
      property.sellerEmail,
      property.sellerName ||
        'Seller',
      property.title,
      'VERIFICATION_REQUIRED',
      adminNotes,
    );
  }

  await createAuditLog({
    actorId: adminUser.id,

    actorName: adminUser.name,

    actorEmail: adminUser.email,

    actorRole: adminUser.role,

    action:
      'PROPERTY_VERIFICATION_REQUEST_INFO',

    entityType: 'PROPERTY',

    entityId: property._id,

    metadata: {
      adminNotes,

      previousVerificationStatus:
        property.verificationStatus,

      previousListingStatus:
        property.listingStatus,

      newVerificationStatus:
        'VERIFICATION_REQUIRED',
    },
  });

  return updatedProperty;
}

/* ================================================================
   SUSPEND
================================================================ */

async function suspendProperty(
  property: IProperty,
  adminUser: VerifyActionPayload['adminUser'],
  adminNotes?: string,
): Promise<IProperty> {
  const now = new Date();

  const conn = await connectToDatabase();
  if (!conn) {
    throw new Error('Database connection failed.');
  }

  const updated = await PropertyModel.findByIdAndUpdate(
    property._id,
    {
      $set: {
        listingStatus: 'PAUSED',
        verificationReviewedAt: now,
        verificationReviewedBy: adminUser.id,
        updatedAt: now,
      },
    },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!updated) {
    throw new Error(
      'Failed to suspend property.',
    );
  }

  const updatedProperty = updated as unknown as IProperty;

  await createAuditLog({
    actorId: adminUser.id,

    actorName: adminUser.name,

    actorEmail: adminUser.email,

    actorRole: adminUser.role,

    action:
      'PROPERTY_VERIFICATION_SUSPEND',

    entityType: 'PROPERTY',

    entityId: property._id,

    metadata: {
      adminNotes,

      previousVerificationStatus:
        property.verificationStatus,

      previousListingStatus:
        property.listingStatus,

      newListingStatus:
        'PAUSED',
    },
  });

  return updatedProperty;
}