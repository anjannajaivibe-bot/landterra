import mongoose, {
  Model,
  Schema,
} from 'mongoose';

import { IUser } from '@/types/user';

/* ================================================================
   USER SCHEMA
================================================================ */

const UserSchema =
  new Schema<IUser>(
    {
      /*
       * Google's stable "sub" identifier.
       *
       * Sparse because existing records may not have one.
       */
      googleId: {
        type: String,
        sparse: true,
      },

      name: {
        type: String,

        required: true,

        trim: true,

        minlength: 1,

        maxlength: 120,
      },

      email: {
        type: String,

        required: true,

        unique: true,

        lowercase: true,

        trim: true,
      },

      /* ----------------------------------------------------------
         PHONE
      ---------------------------------------------------------- */

      phone: {
        type: String,

        trim: true,

        index: true,
      },

      isPhoneVerified: {
        type: Boolean,

        default: false,

        index: true,
      },

      phoneVerifiedAt: {
        type: Date,
      },

      alternatePhone: {
        type: String,

        trim: true,
      },

      /* ----------------------------------------------------------
         PROFILE
      ---------------------------------------------------------- */

      profileImage: {
        type: String,

        trim: true,
      },

      /* ----------------------------------------------------------
         ROLE
      ---------------------------------------------------------- */

      role: {
        type: String,

        enum: [
          'BUYER',
          'SELLER',
          'ADMIN',
        ],

        default: 'BUYER',

        required: true,

        index: true,
      },

      /*
       * IMPORTANT:
       *
       * BUYER is currently the default customer role.
       *
       * A normal customer is NOT restricted from selling.
       *
       * Seller eligibility should be determined by:
       *
       * authenticated account
       * + Google login
       * + phone verification
       * + listing workflow
       */

      sellerType: {
        type: String,

        enum: [
          'INDIVIDUAL',
          'COMPANY',
          'AGENT',
        ],

        default: 'INDIVIDUAL',
      },

      /* ----------------------------------------------------------
         ADDRESS
      ---------------------------------------------------------- */

      address: {
        type: String,

        trim: true,

        maxlength: 500,
      },

      city: {
        type: String,

        trim: true,

        maxlength: 100,
      },

      state: {
        type: String,

        trim: true,

        maxlength: 100,
      },

      pincode: {
        type: String,

        trim: true,

        maxlength: 10,
      },

      /* ----------------------------------------------------------
         ACCOUNT STATUS
      ---------------------------------------------------------- */

      isActive: {
        type: Boolean,

        default: true,

        index: true,
      },

      /*
       * This means the seller identity/property process has
       * been verified by BhoomiMitra.
       *
       * It is NOT the same as phone verification.
       */
      isVerifiedSeller: {
        type: Boolean,

        default: false,

        index: true,
      },
    },

    {
      timestamps: true,

      versionKey: false,
    },
  );

/* ================================================================
   INDEXES
================================================================ */

/*
 * Google ID must be unique when present.
 *
 * Sparse allows old accounts without googleId.
 */

UserSchema.index(
  { googleId: 1 },
  {
    unique: true,
    sparse: true,
  },
);

/* ================================================================
   NEXT.JS MODEL
================================================================ */

export const UserModel: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>(
    'User',
    UserSchema,
  );

export default UserModel;