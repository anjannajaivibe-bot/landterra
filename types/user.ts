/* ================================================================
   USER TYPES
================================================================ */

export type UserRole =
  | 'BUYER'
  | 'SELLER'
  | 'ADMIN';

export type SellerType =
  | 'INDIVIDUAL'
  | 'COMPANY'
  | 'AGENT';

/* ================================================================
   USER
================================================================ */

export interface IUser {
  _id: string;

  /*
   * Stable Google OAuth subject ID.
   */
  googleId?: string;

  name: string;

  email: string;

  /* --------------------------------------------------------------
     PHONE
  -------------------------------------------------------------- */

  phone?: string;

  isPhoneVerified?: boolean;

  phoneVerifiedAt?: string | Date;

  alternatePhone?: string;

  /* --------------------------------------------------------------
     PROFILE
  -------------------------------------------------------------- */

  profileImage?: string;

  /* --------------------------------------------------------------
     ROLE
  -------------------------------------------------------------- */

  role: UserRole;

  sellerType?: SellerType;

  /* --------------------------------------------------------------
     ADDRESS
  -------------------------------------------------------------- */

  address?: string;

  city?: string;

  state?: string;

  pincode?: string;

  /* --------------------------------------------------------------
     ACCOUNT
  -------------------------------------------------------------- */

  isActive: boolean;

  isVerifiedSeller?: boolean;

  /* --------------------------------------------------------------
     TIMESTAMPS
  -------------------------------------------------------------- */

  createdAt: string | Date;

  updatedAt: string | Date;
}

/* ================================================================
   SESSION
================================================================ */

export interface UserSession {
  user: {
    id: string;

    name: string;

    email: string;

    role: UserRole;

    image?: string;

    phone?: string;

    isPhoneVerified?: boolean;

    sellerType?: SellerType;
  };
}

/* ================================================================
   AUDIT LOG
================================================================ */

export interface IAuditLog {
  _id: string;

  actorId: string;

  actorName: string;

  actorEmail: string;

  actorRole: string;

  action: string;

  entityType:
  | 'PROPERTY'
  | 'USER'
  | 'PAYMENT'
  | 'DOCUMENT'
  | 'REPORT'
  | 'SYSTEM';

  entityId: string;

  metadata?: Record<
    string,
    unknown
  >;

  ipAddress?: string;

  createdAt: string | Date;
}