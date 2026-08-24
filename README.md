# BhoomiMitra (भू-मित्र) — Direct Land & Plot Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-15.5.23-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-green?style=flat&logo=mongodb)](https://www.mongodb.com/atlas)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Verified%20Payments-0C2340?style=flat&logo=razorpay)](https://razorpay.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2%20Storage-F38020?style=flat&logo=cloudflare)](https://www.cloudflare.com/products/r2/)

**BhoomiMitra** is a direct-to-owner land and agricultural plot classifieds platform designed for Indian real estate buyers, sellers, and agricultural investors. It eliminates broker commissions by connecting buyers directly with verified landowners through high-trust title document verification, interactive map-based property exploration, and a flat-fee digital advertising model.

---

## 🌟 Key Highlights & Features

### 🏡 Buyer Experience
- **Interactive Land Exploration**: Map-based and list-based search across Indian states, districts, and tehsils.
- **Smart Land Unit Converter**: Automatic area normalization across Indian land measurement units (`Square Yards`, `Guntas`, `Cents`, `Acres`, `Hectares`).
- **Verified Listings**: Clear badges distinguishing verified land listings backed by admin-reviewed title deeds, 7/12 extract (Khata), Encumbrance Certificates (EC), and government survey numbers.
- **Direct Seller Inquiries**: Send messages with optional direct phone-sharing to reach verified owners instantly.
- **Persistent Favorites**: Save listings to a private watchlist synced directly to your MongoDB account.
- **Trust & Safety Reporting**: Report fraud or misleading listings with one-click violation reporting and admin audit logging.

### 🚜 Seller Portal & Listing Engine
- **Multi-Step Listing Creator**: Form with automated image compression (<900 KB) and Cloudflare R2 presigned direct uploads.
- **Interactive GPS Location Picker**: Drop pins with Google Maps, set road width, facing direction, soil type, and toggle approximate location radius privacy.
- **Secure Document Uploads**: Upload government land documents (Pahani, Passbook, EC, Tax Receipts) securely for admin verification.
- **Flat 30-Day Classifieds Model**: Server-controlled flat listing advertisement fee with 30-day listing subscriptions and renewal lifecycle.
- **Listing Management Dashboard**: Pause, resume, edit, delete, or renew listings with real-time view counts, inquiry counters, and payment receipts.

### 🛡️ Admin & Compliance Console (`/admin`)
- **Document Review Suite**: Inspect high-resolution property title deeds and survey records with approval/rejection workflows.
- **System Audit Logs**: Immutable audit trails (`PROPERTY_VERIFIED`, `PROPERTY_REJECTED`, `PLATFORM_SETTINGS_UPDATED`, etc.) for regulatory and trust compliance.
- **Dynamic Platform Settings**: Update listing fees (e.g. flat ₹10–₹25) and advertisement validity periods with MongoDB persistence.
- **User & Reports Management**: Manage customer roles (`BUYER`, `SELLER`, `ADMIN`), view revenue summaries, and resolve listing reports.

### 💬 Customer Support & Helpdesk (`/contact`)
- **Contact Support Desk**: Validated support submission flow persisted to MongoDB with automated Resend email alerts to the support team.

---

## 🏗️ Architecture & Technology Stack

```
                                  BHOOMIMITRA
                                       |
                  ┌────────────────────┴────────────────────┐
                  |                                         |
             BUYER PORTAL                              SELLER PORTAL
                  |                                         |
          Browse & Search                            Google / OTP Auth
          Map & Unit Filters                                |
          Property Details                           Listing Creator
          Inquiries & Favorites                             |
                  |                                 Cloudflare R2 Uploads
          Report Violations                                 |
                                                     Flat 30-Day Listing Fee
                                                            |
                                                     Razorpay Checkout
                                                            |
                                               ┌────────────┴────────────┐
                                               |                         |
                                       Admin Review Suite        30-Day Subscription
                                               |                         |
                                      Verified / Rejected        Active Classified Ad
```

| Layer | Technologies & Services |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) + React 19 + TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons + Motion |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose 8](https://mongoosejs.com/) |
| **Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible Object Storage) |
| **Authentication** | Google OAuth 2.0 + Distributed MongoDB-backed SMS OTP (HMAC-SHA256) |
| **Maps & Geo** | [Google Maps Platform](https://developers.google.com/maps) (Maps JavaScript API, Places API, Geocoding) |
| **Payments** | [Razorpay](https://razorpay.com/) (Server-verified Orders, Signatures, and Webhooks) |
| **Email** | [Resend](https://resend.com/) (Transactional emails for inquiries, receipts, contact queries) |
| **SMS Gateway** | Fast2SMS / Twilio with automated failed-delivery challenge rollback |

---

## 🔒 Security & Reliability Hardening

1. **Serverless-Safe Distributed OTP System**:
   - OTP challenge state is backed by MongoDB (`OtpChallengeModel`) rather than volatile in-process memory.
   - Secret-salted HMAC-SHA256 hashing ensures plaintext OTP tokens are never stored in the database.
   - Single-use atomic consumption prevents replay attacks.
   - 5-attempt limit and 60-second cooldown protection.
   - Automated rollback cleans up dead challenges if SMS gateway dispatch fails.
   - Automatic expiration cleanup via MongoDB TTL indexes (`{ expires: 0 }`).

2. **Authoritative Server Pricing**:
   - Razorpay orders strictly compute listing fees from the authoritative MongoDB platform settings; client-supplied prices or durations are never trusted.
   - Webhook and payment verification validate HMAC-SHA256 signatures server-side.

3. **Strict MongoDB Persistence**:
   - Inquiries, favorites, reports, contact queries, and audit logs are strictly persisted to MongoDB with defensive error handling.

---

## 📁 Repository Structure

```text
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Landing page & search hero
│   │   ├── buy/page.tsx                 # Land browsing, filtering & search
│   │   ├── sell/page.tsx                # Multi-step property listing & upload form
│   │   ├── contact/page.tsx             # Support contact form
│   │   ├── about/page.tsx               # About BhoomiMitra
│   │   ├── listing-rules/page.tsx       # Classifieds publishing rules
│   │   ├── privacy/page.tsx             # Privacy policy
│   │   └── terms/page.tsx               # Terms of service
│   ├── admin/
│   │   └── page.tsx                     # Admin trust & safety console
│   ├── dashboard/
│   │   ├── buyer/page.tsx               # Buyer watchlist & inquiries
│   │   └── seller/page.tsx              # Seller listing management & billing
│   ├── profile/
│   │   └── page.tsx                     # User profile, phone verification, and settings
│   ├── properties/[id]/
│   │   └── page.tsx                     # Dynamic property details page
│   └── api/
│       ├── admin/                       # Admin verification, stats, and audit APIs
│       ├── auth/                        # Google OAuth, Session, and OTP APIs
│       ├── contact/                     # Contact query API
│       ├── documents/                   # Secure document download streaming
│       ├── favorites/                   # Watchlist toggle & fetch
│       ├── inquiries/                   # Buyer-seller inquiries
│       ├── integrations/                # Health check & integrations status
│       ├── payments/                    # Razorpay order, verification & webhook
│       ├── properties/                  # Listing CRUD & status updates
│       ├── reports/                     # Property violation reporting
│       ├── settings/                    # Public platform settings
│       └── uploads/                     # Cloudflare R2 presigned URL & direct upload
├── components/
│   ├── admin/                           # PropertyReviewModal, etc.
│   ├── auth/                            # AuthModal & phone OTP components
│   ├── layout/                          # Navbar, Footer, MobileNav
│   ├── maps/                            # GoogleMapPicker & PropertyMap
│   ├── payments/                        # RazorpayCheckoutModal
│   └── properties/                      # PropertyCard, PropertyFilter, ReportModal
├── config/                              # Constants, land types, states, unit conversions
├── lib/
│   ├── auth/                            # MongoDB OTP service & normalization
│   ├── db/                              # MongoDB connection manager
│   ├── email/                           # Resend client
│   ├── maps/                            # Google Maps client helper
│   ├── r2/                              # Cloudflare R2 S3 client
│   ├── razorpay/                        # Razorpay SDK client & signature verifier
│   ├── security/                        # Session cookies, JWT, rate limiter
│   └── validation/                      # Zod schemas for properties & payments
├── models/                              # Mongoose Schemas (User, Property, Payment, OTP, etc.)
├── services/                            # Business logic (property, payment, inquiry, audit, settings)
└── types/                               # TypeScript interfaces & domain models
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.17.0` or higher
- **npm** or **yarn** / **pnpm**
- **MongoDB Atlas** database connection string

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/JairamMargam/landterra.git
cd landterra
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root based on `.env.example`:

```bash
cp .env.example .env.local
```

Populate the required environment variables:

```env
# Database
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/bhoomimitra?retryWrites=true&w=majority"

# Authentication & Security
AUTH_SECRET="your-32-character-random-auth-secret-string"
OTP_HASH_SECRET="your-dedicated-32-byte-random-secret-for-otp-hashing"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Maps Platform
GOOGLE_MAPS_API_KEY="AIzaSy..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."

# Cloudflare R2 Object Storage
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="bhoomimitra-assets"
R2_PUBLIC_URL="https://pub-yourbucket.r2.dev"

# Razorpay Payments
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."

# Resend Email Service
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="BhoomiMitra <notifications@yourdomain.com>"
SUPPORT_EMAIL="support@yourdomain.com"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"

# Admin Security
ADMIN_EMAILS="admin1@example.com,admin2@example.com"
ADMIN_SECRET_KEY="super_secure_admin_passcode"

# SMS OTP Provider
OTP_PROVIDER="test" # "twilio" | "fast2sms" | "test"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
FAST2SMS_API_KEY=""
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the verification suite:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Production compilation test
npm run build
```

---

## 🌐 Production Deployment (Vercel)

1. Connect your repository to **Vercel**.
2. Set Framework Preset to **Next.js**.
3. Add all production environment variables from `.env.local` in the **Vercel Project Settings**.
4. Set `NEXT_PUBLIC_APP_URL` and `APP_URL` to your production domain (e.g., `https://bhoomimitra.com`).
5. Ensure your MongoDB Atlas cluster allows incoming connections from Vercel's IP ranges (`0.0.0.0/0` with strong authentication).
6. Configure your Razorpay Webhook URL to `https://bhoomimitra.com/api/payments/webhook` listening for `payment.captured` and `order.paid` events.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.