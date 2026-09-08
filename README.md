# BhoomiMitra (भू-मित्र) — Direct Land & Property Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-15.5.23-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-green?style=flat&logo=mongodb)](https://www.mongodb.com/atlas)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2%20Storage-F38020?style=flat&logo=cloudflare)](https://www.cloudflare.com/products/r2/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Verified%20Payments-0C2340?style=flat&logo=razorpay)](https://razorpay.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis%20Rate%20Limiting-00e9a3?style=flat&logo=redis)](https://upstash.com/)
[![Resend](https://img.shields.io/badge/Resend-Transactional%20Email-black?style=flat&logo=resend)](https://resend.com/)

**BhoomiMitra** is India's direct-to-owner land and real estate classifieds platform. Engineered to eliminate broker commissions, BhoomiMitra connects buyers directly with landowners and verified sellers through transparent peer-to-peer listings, interactive Google Satellite GIS mapping, direct phone call lead tracking, automated due diligence advisories, and a server-controlled flat-fee 30-day advertising model.

---

## 📑 Table of Contents

- [Key Value Propositions](#-key-value-propositions)
- [System Architecture](#-system-architecture)
- [Core Features & Modules](#-core-features--modules)
  - [1. Buyer Experience & Exploration](#1-buyer-experience--exploration)
  - [2. Seller Portal & Listing Engine](#2-seller-portal--listing-engine)
  - [3. Seller Analytics & Lead Management](#3-seller-analytics--lead-management)
  - [4. Modular Admin & Compliance Suite](#4-modular-admin--compliance-suite)
  - [5. Automated Crons & Lifecycle Engine](#5-automated-crons--lifecycle-engine)
- [Indian Land Measurement Standard](#-indian-land-measurement-standard)
- [Production Security & Hardening](#-production-security--hardening)
- [Repository & File Layout](#-repository--file-layout)
- [Database Models & Indexes](#-database-models--indexes)
- [API Routes Reference](#-api-routes-reference)
- [Environment Variables](#-environment-variables)
- [Local Development & Setup](#-local-development--setup)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🌟 Key Value Propositions

| Pillar | How BhoomiMitra Delivers It |
| :--- | :--- |
| **0% Brokerage** | 100% direct-to-owner peer-to-peer classifieds. Direct landowner phone and email reveal without broker markups. |
| **Rich Property Taxonomy** | 5 comprehensive categories covering 25+ property types: **Land & Plots**, **Residential Units**, **Commercial & Retail**, **Hospitality & Leisure**, and **Income-Generating Rentals**. |
| **Geospatial Intelligence** | MongoDB `2dsphere` geospatial indexing with `$near` proximity search and `$geoWithin` spherical radius filtering. Switchable Google Satellite and Roadmap GIS exploration. |
| **Anti-Fraud & Quality** | Strict 2-listing limit per seller, deep content-level duplicate detection (matching media keys, documents, or title+area+pincode), and government document moderation suite. |
| **Flat Advertising Model** | Eliminates percentage commissions with server-authoritative flat listing fees (e.g. ₹10–₹25 for 30-day advertisement cycles) powered by Razorpay. |
| **Legal Due Diligence First** | Every listing includes prominent independent legal advisories, advocate verification guidance, and a built-in due diligence checklist. |

---

## 🏗️ System Architecture

```text
                                       BHOOMIMITRA PLATFORM
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
   BUYER PORTAL                           SELLER PORTAL                          ADMIN CONSOLE
         │                                      │                                      │
 ┌───────┴───────┐                      ┌───────┴───────┐                      ┌───────┴───────┐
 │ Browse & Search│                      │ Multi-Step Form│                     │ Title Deed Review
 │ Satellite GIS │                      │ GPS Pin Drop  │                      │ Payment Audits│
 │ Unit Converter│                      │ Cloudflare R2 │                      │ Subscriptions │
 │ Direct Calls  │                      │ Razorpay Flat │                      │ Audit Logging │
 │ Watchlist Sync│                      │ Lead Manager  │                      │ CSV Exports   │
 └───────────────┘                      └───────────────┘                      └───────────────┘
         │                                      │                                      │
         └──────────────────────────────────────┼──────────────────────────────────────┘
                                                │
                                    NEXT.JS 15 APP ROUTER
                               (React 19 + TypeScript 5.9)
                                                │
     ┌───────────────────┬──────────────────────┼───────────────────┬──────────────────┐
     ▼                   ▼                      ▼                   ▼                  ▼
MONGODB ATLAS     CLOUDFLARE R2           RAZORPAY API        UPSTASH REDIS      RESEND EMAIL
Mongoose 9.9      Object Storage          Server Orders       Sliding-Window     Transactional
2dsphere Geo      Presigned Uploads       HMAC Webhooks       Rate Limiter       Notifications
```

---

## 🚀 Core Features & Modules

### 1. Buyer Experience & Exploration

- **Modular Search & Filter Bar (`/buy`)**:
  - Filter across 25+ plot, residential, commercial, and hospitality property types.
  - Multi-unit area filtering with dynamic unit conversion (`Sq. Yards`, `Guntas`, `Cents`, `Acres`, `Hectares`).
  - Budget sliders, price per yard ranges, facing direction (North, East, West, South, etc.), road width, soil type, and approval filters (DTCP, HMDA, RERA, Gram Panchayat, Agricultural).
  - Quick-toggle active filter badges with one-click filter dismissal and URL query persistence.
- **Geospatial Satellite & Roadmap Explorer (`/properties/[id]`)**:
  - Switch seamlessly between high-resolution Google Satellite imagery and Roadmap view.
  - Interactive pin overlay with optional approximate privacy radius masking.
  - Instant Google Maps driving directions launch.
- **Direct "Call Landowner" Lead Action**:
  - One-click phone reveal button that triggers a direct phone call (`tel:`) to the property owner.
  - Rate-limited and protected against automated scrapers.
  - Automatically records buyer details, property ID, and timestamp into MongoDB `inquiries` and immutable `auditlogs`.
- **Smart Land Area Converter Tool (`components/tools/LandAreaConverter.tsx`)**:
  - Interactive bidirectional unit conversion calculator for Indian regional land measurements.
- **Buyer Watchlist & Inquiry Tracker (`/dashboard/buyer`)**:
  - Synchronized MongoDB watchlist allowing buyers to bookmark properties.
  - Outgoing inquiry tracker with seller response status.
- **Comprehensive Due Diligence Advisories**:
  - Dedicated due diligence cards on property detail pages advising buyers to inspect original title deeds, verify Encumbrance Certificates (EC), and consult legal advocates.

### 2. Seller Portal & Listing Engine

- **Multi-Step Listing Creator (`/sell`)**:
  - Guided creation process covering basic details, property categorization, land dimensions, pricing, and amenities.
  - Client-side image compression (<900 KB) before direct upload to Cloudflare R2 via presigned URLs.
  - Video tour uploads with thumbnail generation and serverless FFmpeg processing.
  - Document attachment support for official records (Title Deed, Passbook / Pahani, Encumbrance Certificate, Tax Receipts).
- **Interactive GPS Location Picker (`components/maps/GoogleMapPicker.tsx`)**:
  - Drop pins directly on Google Maps, auto-resolve address components, and enter road width and facing.
  - Optional approximate location toggle for seller privacy.
- **Seller Limits & Anti-Duplicate Protection**:
  - **2-Listing Limit**: Enforces a strict limit of 2 active or draft listings per seller account/phone/email to deter broker bulk spam.
  - **Deep Content Duplicate Detection**: Automatically blocks duplicate listings by cross-checking media hashes/keys, document keys, and exact title + area + pincode combinations.
- **Server-Controlled Flat Fee Model**:
  - Authoritative fee calculation (e.g. ₹10 for 30 days) fetched server-side from MongoDB `PlatformSettings`.
  - Secure checkout via Razorpay with cryptographic HMAC-SHA256 signature verification.

### 3. Seller Analytics & Lead Management

- **Seller Dashboard (`/dashboard/seller`)**:
  - Real-time performance metrics: Total Views, Phone Unlocks, Inquiries, Active Listings, Expired Listings, and Fees Paid.
  - Listing-level badges showing weekly views and total phone reveals.
  - Listing lifecycle management: Pause, Resume, Edit, Delete, or Renew listings.
  - Direct Lead Inbox: View buyer inquiries with one-click **"Call Buyer" (`tel:`)** and **"Email Buyer" (`mailto:`)** actions.
  - Interactive lead status progression: `PENDING` → `RESPONDED` → `CLOSED`.

### 4. Modular Admin & Compliance Suite

Accessible via `/admin` with unified navigation in `AdminShell`:

- **Executive KPI Dashboard (`/admin`)**: Total listings, active subscriptions, platform revenue, pending moderations, and system health status.
- **Document Review Suite (`/admin/moderation`)**: High-resolution document viewer for reviewing property deeds, Pahani records, and survey maps with one-click Approve / Reject (with custom feedback reason) workflows.
- **Listing Inventory (`/admin/properties`)**: Filter and manage all platform properties across all lifecycle statuses (`PUBLISHED`, `PENDING_VERIFICATION`, `PAUSED`, `EXPIRED`, `REJECTED`).
- **Payment Audits (`/admin/payments`)**: Complete log of Razorpay orders, transaction IDs, payment statuses, and date filters with **one-click CSV Export**.
- **Subscription Tracker (`/admin/subscriptions`)**: 30-day listing subscription logs with expiration dates, renewal tracking, and **CSV Export**.
- **User Management (`/admin/users`)**: Search users, monitor phone verification statuses, and update roles (`BUYER`, `SELLER`, `ADMIN`).
- **Trust & Safety Reports (`/admin/reports`)**: Resolve community violation and scam reports submitted by buyers.
- **Immutable Audit Trails (`/admin/audit-logs`)**: Searchable audit logs capturing all administrative and sensitive operations.
- **Dynamic Platform Settings (`/admin/settings`)**: Live configuration for listing fees, subscription validity days, and maintenance mode without redeployment.

### 5. Automated Crons & Lifecycle Engine

Configured via `vercel.json` and secured with `CRON_SECRET` authorization:

- **Subscription Expiry Sync (`/api/cron/sync-expired-subscriptions`)**: Runs daily at midnight (`0 0 * * *`). Transitions expired listings from `PUBLISHED` to `EXPIRED` and dispatches automated pre-expiry reminder emails at 3-day and 1-day thresholds.
- **Orphan Uploads Cleanup (`/api/cron/cleanup-orphaned-uploads`)**: Runs daily at 2 AM (`0 2 * * *`). Scans Cloudflare R2 buckets for uploaded images/videos that were never linked to an active property listing and purges them to optimize storage costs.

---

## 📐 Indian Land Measurement Standard

All land plots on BhoomiMitra are internally normalized to **Square Yards (sq. yd)** for consistent comparison, search, and pricing calculations:

$$\text{1 Acre} = 4,840 \text{ sq. yd} = 40 \text{ Guntas} = 100 \text{ Cents}$$

$$\text{1 Gunta} = 121 \text{ sq. yd} \approx 1,089 \text{ sq. ft}$$

$$\text{1 Cent} = 48.4 \text{ sq. yd} \approx 435.6 \text{ sq. ft}$$

$$\text{1 Hectare} = 11,959.9 \text{ sq. yd} \approx 2.471 \text{ Acres}$$

$$\text{1 Bigha (Standard)} \approx 1,600 \text{ to } 3,025 \text{ sq. yd (region-specific)}$$

---

## 🔒 Production Security & Hardening

1. **Cryptographic Session Tokens (`lib/security/auth.ts`)**:
   - Custom HMAC-SHA256 signed session tokens verified using constant-time equality (`crypto.timingSafeEqual`).
   - Strict timestamp checks ($exp > now$, $iat \le now + 60\text{s}$, $exp \le now + 31\text{d}$) preventing replay and future-dated attacks.
   - Authoritative user validation against MongoDB on every session check (`isActive`, `role`, `isPhoneVerified`).
   - Secure cookie attributes: `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

2. **Distributed SMS OTP Protection (`lib/auth/otp.ts`)**:
   - Plaintext OTPs are never stored or logged; only salted HMAC-SHA256 hashes (`hashOtp(phone, otp)`) are persisted in MongoDB.
   - Automatic challenge rollback if SMS delivery fails, preventing orphaned OTP lockouts.
   - 5-minute expiry via MongoDB TTL indexes (`expires: 0`), 60-second cooldown, and 5-attempt brute-force protection.
   - Production lock: mock/test OTP modes are strictly disabled when `NODE_ENV === 'production'`.

3. **Distributed Rate Limiting (`lib/security/rate-limit.ts`)**:
   - Powered by Upstash Redis sliding-window rate limiting across serverless lambdas.
   - Graceful, zero-downtime automatic fallback to an in-memory sliding-window limiter if Upstash Redis is unconfigured or unreachable.

4. **Cloudflare Turnstile Bot Defense (`components/security/CloudflareTurnstile.tsx`)**:
   - Integrated on public forms (Contact, Auth, Violation Reports) to prevent automated bot spam.

5. **SSRF-Hardened Map Resolver (`/api/resolve-map-link`)**:
   - Validates and restricts Google Maps URL expansion to official Google domains (`maps.app.goo.gl`, `goo.gl/maps`, `google.com/maps`).
   - Blocks private IP ranges and local loopbacks to eliminate Server-Side Request Forgery risks.

6. **Secure Document Streaming (`/api/documents/download`)**:
   - Property deeds and government certificates are never exposed as public URLs.
   - Downloads are streamed securely after verifying user permissions (`canAccessDocument`) against the authenticated session.

7. **Strict HTTP Security Headers (`next.config.ts`)**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

---

## 📁 Repository & File Layout

```text
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Landing page with hero search, trust pillars, and directory
│   │   ├── buy/                         # Land & property browsing, filtering, and pagination
│   │   ├── sell/                        # Multi-step property creation wizard with image compression
│   │   ├── contact/                     # Validated support desk form with Resend alerts
│   │   ├── pricing/                     # Flat-fee listing advertising pricing
│   │   ├── about/                       # Platform mission and zero-brokerage model
│   │   ├── listing-rules/               # Seller undertakings and prohibited listings policy
│   │   ├── privacy/                     # Privacy policy
│   │   ├── refund-policy/               # Refund policy
│   │   └── terms/                       # Terms of service
│   ├── admin/                           # Admin Console (Layout wrapped in AdminShell)
│   │   ├── page.tsx                     # Executive KPI Dashboard
│   │   ├── moderation/                  # Document review suite for property title deeds
│   │   ├── properties/                  # Listing inventory management
│   │   ├── payments/                    # Payment transactions & CSV export
│   │   ├── subscriptions/               # 30-day subscriptions lifecycle & CSV export
│   │   ├── users/                       # User role and verification management
│   │   ├── reports/                     # Trust & safety report resolution
│   │   ├── audit-logs/                  # Searchable system audit trails
│   │   └── settings/                    # Dynamic platform listing fee settings
│   ├── dashboard/
│   │   ├── buyer/page.tsx               # Buyer watchlist and inquiry tracker
│   │   └── seller/page.tsx              # Seller analytics, listing management, and lead inbox
│   ├── profile/page.tsx                 # User profile, mobile verification, and preferences
│   ├── properties/[id]/                 # Dedicated property details page, satellite maps & JSON-LD
│   ├── api/
│   │   ├── admin/                       # Admin statistics, moderation, audit, and settings APIs
│   │   ├── auth/                        # Google OAuth, SMS OTP, and session endpoints
│   │   ├── contact/                     # Customer contact query API
│   │   ├── cron/                        # Scheduled tasks: subscription sync & orphaned upload cleanup
│   │   ├── documents/                   # Secure authenticated document download streamer
│   │   ├── favorites/                   # Watchlist toggle and fetch API
│   │   ├── inquiries/                   # Lead submission and status management API
│   │   ├── integrations/                # Health check and integrations status
│   │   ├── payments/                    # Razorpay order, verification, and webhook APIs
│   │   ├── properties/                  # Property CRUD, geospatial search, and call action API
│   │   ├── reports/                     # Listing violation reporting API
│   │   ├── resolve-map-link/            # SSRF-protected Google Maps URL resolver
│   │   ├── settings/                    # Public platform settings API
│   │   └── uploads/                     # Cloudflare R2 presigned URLs, direct upload, and video processing
│   ├── manifest.ts                      # Progressive Web App (PWA) manifest
│   ├── robots.ts                        # Search engine crawling rules
│   └── sitemap.ts                       # Dynamic XML sitemap generator
├── components/
│   ├── admin/                           # AdminShell, PropertyReviewModal, and admin components
│   ├── auth/                            # AuthModal and PhoneOtpModal
│   ├── buy/                             # FilterBar, ActiveFilterBadges, PropertyPagination, BuySkeletons
│   ├── layout/                          # Navbar, Footer, MobileNav
│   ├── legal/                           # DueDiligenceChecklist
│   ├── maps/                            # GoogleMapPicker and PropertyDetailMap
│   ├── payments/                        # RazorpayCheckoutModal
│   ├── properties/                      # PropertyCard, GalleryCarousel, LocationSection, Specifications
│   ├── security/                        # CloudflareTurnstile widget
│   ├── sell/                            # Form steps, image/video uploaders, document attachers
│   └── tools/                           # LandAreaConverter component
├── config/                              # Indian land types, states, unit conversion constants
├── lib/
│   ├── auth/                            # OTP generation, hashing, and normalization
│   ├── db/                              # Resilient MongoDB Mongoose connection manager
│   ├── email/                           # Resend email client configuration
│   ├── maps/                            # Google Maps API helpers
│   ├── r2/                              # Cloudflare R2 S3 client configuration
│   ├── razorpay/                        # Razorpay SDK initialization and signature verifier
│   ├── security/                        # Auth sessions, Turnstile verification, rate limiting, cron auth
│   └── validation/                      # Zod schemas for properties, payments, and users
├── models/                              # Mongoose Models (Property, User, Payment, Subscription, etc.)
├── services/                            # Core business logic (property, payment, inquiry, audit, upload, video)
└── types/                               # TypeScript domain definitions
```

---

## 🗄️ Database Models & Indexes

| Model | Primary Purpose | Key Indexes |
| :--- | :--- | :--- |
| **`Property`** | Real estate and plot listings | `{ locationCoordinates: '2dsphere' }`<br>`{ listingStatus: 1, 'location.city': 1 }`<br>`{ listingStatus: 1, landAreaYards: 1, totalPrice: 1 }`<br>`{ sellerId: 1, listingStatus: 1 }`<br>`{ createdAt: -1 }` |
| **`User`** | Buyers, sellers, and administrators | `{ email: 1 }` (unique)<br>`{ phone: 1 }`<br>`{ googleId: 1 }` (sparse) |
| **`ListingSubscription`** | 30-day listing advertising subscriptions | `{ propertyId: 1, status: 1 }`<br>`{ expiresAt: 1 }`<br>`{ sellerId: 1 }` |
| **`Payment`** | Razorpay transactions and orders | `{ razorpayOrderId: 1 }`<br>`{ razorpayPaymentId: 1 }`<br>`{ sellerId: 1 }` |
| **`Inquiry`** | Buyer leads and direct phone call unlocks | `{ propertyId: 1, createdAt: -1 }`<br>`{ sellerId: 1 }`<br>`{ buyerPhone: 1 }` |
| **`OtpChallenge`** | Salted HMAC-SHA256 phone verification tokens | `{ phone: 1 }`<br>`{ expiresAt: 1 }` (TTL index `{ expires: 0 }`) |
| **`AuditLog`** | Immutable system and administrative event log | `{ action: 1, timestamp: -1 }`<br>`{ targetId: 1 }`<br>`{ actorId: 1 }` |
| **`PlatformSettings`** | Dynamic publishing fees and listing validity | `{ isCurrent: 1 }` (singleton) |
| **`ContactMessage`** | Customer support submissions | `{ status: 1, createdAt: -1 }` |

---

## 🔌 API Routes Reference

### Public & Marketplace
- `GET /api/properties` — Fetch properties with full-text search, pagination, and `$near` / `$geoWithin` geospatial radius filtering.
- `GET /api/properties/[id]` — Retrieve full property details with view-count incrementation and seller masking.
- `POST /api/properties/[id]/call` — Unlock seller phone number, log lead inquiry, and record audit trail.
- `GET /api/settings/public` — Get live platform listing fees and advertisement duration.
- `POST /api/contact` — Submit customer support grievance or query.
- `POST /api/resolve-map-link` — Expand Google Maps short links into lat/lng coordinates (SSRF-protected).

### Authentication & User
- `GET /api/auth/session` — Resolve authenticated user profile and permissions.
- `POST /api/auth/otp/send` — Request 6-digit SMS OTP (Fast2SMS / Twilio).
- `POST /api/auth/otp/verify` — Verify SMS OTP against salted HMAC challenge.
- `GET /api/auth/google` & `/api/auth/google/callback` — Google OAuth 2.0 flow.
- `POST /api/auth/logout` — Clear session cookie and invalidate authentication.
- `GET|POST /api/favorites` — Manage buyer saved properties watchlist.

### Seller Operations
- `POST /api/properties` — Create draft or pending listing with 2-listing limit and duplicate checks.
- `PATCH /api/properties/[id]` — Update property attributes, media, or coordinates.
- `DELETE /api/properties/[id]` — Soft-delete listing and cancel active advertising.
- `POST /api/uploads/presigned-url` — Request presigned Cloudflare R2 upload URL for images and documents.
- `POST /api/uploads/video` & `/api/uploads/video/process` — Video tour upload and transcoding.
- `POST /api/payments/create-order` — Create Razorpay order with server-calculated listing fee.
- `POST /api/payments/verify` — Verify payment signature and activate 30-day listing subscription.
- `POST /api/payments/webhook` — Asynchronous Razorpay webhook handler (`order.paid`, `payment.captured`).

### Admin Console
- `GET /api/admin/stats` — Executive metrics (GMV, active listings, verifications, users).
- `GET /api/admin/properties` — Filter listings by status with pagination.
- `POST /api/admin/properties/[id]/verify` — Approve or reject property title deeds with moderator notes.
- `GET /api/admin/users` — User management and role switching.
- `GET /api/admin/audit-logs` — Immutable audit logs query.
- `GET|PATCH /api/admin/settings` — Configure dynamic platform settings.

### Automated Crons
- `GET /api/cron/sync-expired-subscriptions` — Daily subscription sync and pre-expiry reminder dispatch (`Bearer <CRON_SECRET>`).
- `GET /api/cron/cleanup-orphaned-uploads` — Daily Cloudflare R2 abandoned upload cleanup (`Bearer <CRON_SECRET>`).

---

## ⚙️ Environment Variables

Create a `.env.local` file in your project root with the following keys:

```env
# ==============================================================================
# DATABASE (MongoDB Atlas)
# ==============================================================================
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/bhoomimitra?retryWrites=true&w=majority"

# ==============================================================================
# AUTHENTICATION & SECURITY
# ==============================================================================
AUTH_SECRET="your-32-character-random-session-secret"
OTP_HASH_SECRET="your-32-character-random-secret-for-otp-salting"
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# ==============================================================================
# GOOGLE MAPS PLATFORM
# ==============================================================================
GOOGLE_MAPS_API_KEY="AIzaSy..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."

# ==============================================================================
# CLOUDFLARE R2 OBJECT STORAGE (S3-Compatible)
# ==============================================================================
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="bhoomimitra-assets"
R2_PUBLIC_URL="https://pub-yourbucket.r2.dev"

# ==============================================================================
# RAZORPAY PAYMENTS
# ==============================================================================
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."

# ==============================================================================
# UPSTASH REDIS (Serverless Rate Limiting)
# ==============================================================================
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# ==============================================================================
# RESEND EMAIL SERVICE
# ==============================================================================
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="BhoomiMitra <notifications@bhoomimitra.com>"
SUPPORT_EMAIL="support@bhoomimitra.com"

# ==============================================================================
# SMS OTP GATEWAY (fast2sms | twilio | test)
# ==============================================================================
OTP_PROVIDER="fast2sms"
FAST2SMS_API_KEY="your-fast2sms-api-key"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# ==============================================================================
# SCHEDULED CRON AUTHORIZATION
# ==============================================================================
CRON_SECRET="your-32-character-random-cron-secret"

# ==============================================================================
# CLOUDFLARE TURNSTILE (Bot Defense)
# ==============================================================================
NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAA..."
TURNSTILE_SECRET_KEY="0x4AAAAAA..."

# ==============================================================================
# ADMIN SECURITY & APP URL
# ==============================================================================
ADMIN_EMAILS="admin@bhoomimitra.com"
ADMIN_SECRET_KEY="super_secure_admin_passcode"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

---

## 💻 Local Development & Setup

### Prerequisites
- **Node.js**: `v20.x` or higher (tested on Node.js 20 & 22)
- **npm** or **pnpm**
- **MongoDB Atlas** cluster (with `2dsphere` index permissions)

### 1. Clone and Install
```bash
git clone https://github.com/JairamMargam/landterra.git
cd landterra
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Fill in your database and API credentials in .env.local
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build and Code Quality
```bash
# Type-checking
npx tsc --noEmit

# Linting
npm run lint

# Production build test
npm run build
```

---

## 🚢 Production Deployment

### Deploying to Vercel

1. Push your repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com/).
3. Ensure Framework Preset is detected as **Next.js**.
4. Populate all production environment variables in **Vercel Project Settings**.
5. Set `NEXT_PUBLIC_APP_URL` and `APP_URL` to your production domain (e.g. `https://bhoomimitra.com`).
6. Configure your **MongoDB Atlas Network Access** to permit inbound traffic from Vercel (`0.0.0.0/0` with strong authentication).
7. Configure **Razorpay Webhooks**:
   - Webhook URL: `https://bhoomimitra.com/api/payments/webhook`
   - Secret: Must match `RAZORPAY_WEBHOOK_SECRET`
   - Active Events: `order.paid`, `payment.captured`, `payment.failed`
8. Scheduled Vercel Crons (`vercel.json`) will automatically invoke `/api/cron/sync-expired-subscriptions` and `/api/cron/cleanup-orphaned-uploads` with `Authorization: Bearer <CRON_SECRET>`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
