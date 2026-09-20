# BhoomiMitra (भू-मित्र) - Property Marketplace

BhoomiMitra is an India-focused property marketplace for **Sale, Rent, and Lease** listings across:

- Land & Plots
- Residential
- Commercial
- Hospitality

The platform supports **Individual, Company, and Agent** sellers. Buyers and tenants can discover listings and contact the listed seller directly.

## Current Marketplace Model

- **₹0 current platform listing fee**
- **0% BhoomiMitra platform brokerage**
- No marketplace payment collection
- No booking, token, rent, deposit, sale consideration, or transaction payment collection
- No paid listing subscription or 30-day renewal requirement
- Public marketplace visibility is controlled by listing lifecycle and moderation status, not payment status
- Third-party agent or intermediary fees, where applicable, are separate arrangements between the relevant users

## Technology

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- MongoDB / Mongoose
- Cloudflare R2-compatible object storage
- Upstash Redis rate limiting
- Resend transactional email
- Google Maps integration

## Core Features

### Property Discovery

- Search and filter property listings
- Sale, rent, and lease transaction types
- Residential, commercial, land, agricultural, industrial, and hospitality categories
- Location-aware property browsing
- Property detail pages
- Map and geospatial support
- Seller contact and inquiry flows
- Buyer due-diligence guidance

### Seller Experience

- Seller types: `INDIVIDUAL | COMPANY | AGENT`
- Draft and submission workflow
- Property images, video, and supporting documents
- Seller listing dashboard
- Duplicate-listing protection
- Listing limit controls
- Listing pause, sold, delete, and moderation lifecycle

### Moderation and Admin

- Property review and moderation
- User management
- Trust and safety reporting
- Audit logging
- Platform access controls
- Marketplace operational statistics

## Listing Lifecycle

Current new-listing flow:

```text
DRAFT
  -> PENDING_VERIFICATION
  -> PUBLISHED
```

Other lifecycle states such as `PAUSED`, `SOLD`, `REJECTED`, and `DELETED` remain part of marketplace management.

Historical statuses including `PAYMENT_PENDING`, `EXPIRING_SOON`, and `EXPIRED` are retained only for backward compatibility with older records. They are not part of the current free-listing publishing model.

Public marketplace queries expose `PUBLISHED` listings.

## Legacy Payment / Subscription Compatibility

Older property records may still contain fields such as:

- `publishingFee`
- `monthlyListingFee`
- `paymentStatus`
- `subscriptionStartedAt`
- `subscriptionExpiresAt`
- `isFeePaid`

These fields are retained temporarily so historical records can be read safely.

New listings:

- use zero platform publishing fees
- use zero monthly listing fees
- do not receive new subscription timestamps
- do not require payment before publication

A read-only audit utility is available:

```bash
npm run audit:legacy-listings
```

It reports aggregate counts for legacy statuses, fee fields, subscription fields, and related indexes. It does not modify database records.

## Property Review and Due Diligence

BhoomiMitra may review listing information and supporting documents as part of its moderation process.

A BhoomiMitra review does **not** guarantee:

- ownership
- legal title
- encumbrance-free status
- measurements
- approvals
- land-use permissions
- valuation
- suitability
- authenticity of all submitted documents

Buyers and tenants should independently verify the property, seller authority, legal title, registration records, approvals, physical boundaries, and transaction documents before making a financial commitment.

## Property Types

Canonical property groups include:

### Land & Plots
- Residential Plot
- Farm Plot
- Agricultural Land
- Commercial Land
- Industrial Plot
- Institutional Land

### Residential
- Flat / Apartment
- Independent House
- Villa
- Townhouse
- Duplex
- Penthouse
- Farmhouse

### Commercial
- Retail Shop
- Showroom
- Office Space
- Co-working Space
- Shopping Mall
- Warehouse / Godown
- Industrial Building
- Industrial Shed

### Hospitality
- Hotel
- Resort
- Serviced Apartment
- Guest House

Legacy taxonomy IDs remain supported where necessary so older listings and links continue to work.

## Security and Platform Controls

The application includes:

- authenticated user sessions
- phone OTP support
- server-side property validation
- rate limiting
- audit trails
- secure document-access controls
- SSRF protections for map-link resolution
- HTTP security headers
- seller spam and duplicate-listing checks

## Important Public Routes

```text
/                     Homepage
/buy                  Property discovery
/sell                 Create or submit a listing
/about                About BhoomiMitra
/listing-rules        Publishing and seller rules
/terms                Terms of Service
/privacy              Privacy Policy
/refund-policy        Payments and refund information
/contact              Support and grievances
/dashboard/seller     Seller dashboard
/admin                 Admin operations
```

## Main Marketplace APIs

Examples of active marketplace API areas include:

```text
/api/properties
/api/properties/[id]
/api/inquiries
/api/favorites
/api/contact
/api/uploads
/api/reports
/api/auth
/api/admin
```

Obsolete payment-order, payment-verification, paid-subscription, and subscription-expiry routes have been removed from the current architecture.

## Environment

Typical production configuration includes:

```env
MONGODB_URI=
AUTH_SECRET=
OTP_HASH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
SUPPORT_EMAIL=
NEXT_PUBLIC_APP_URL=
APP_URL=
```

Actual environment requirements should be checked against the current code and deployment configuration before adding or removing production secrets.

## Local Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

Legacy data audit:

```bash
npm run audit:legacy-listings
```

## Production Deployment

The project is deployed through Vercel from the `main` branch.

Before treating a deployment as production-ready:

1. Confirm the exact `main` commit reaches Vercel `READY`.
2. Verify homepage and property-search routes.
3. Verify `/api/properties`.
4. Verify legal pages, sitemap, and robots.
5. Check production runtime errors.
6. Confirm no obsolete paid-listing or owner-only claims were reintroduced.

## Marketplace Language Rules

Use:

- **Seller**
- **Individual Seller**
- **Company Seller**
- **Agent Seller**
- **Direct seller contact**
- **0% Platform Brokerage**
- **₹0 Current Platform Listing Fee**
- **Listing Reviewed**

Avoid broad claims such as:

- owner-only or landowner-only marketplace claims
- unqualified claims that no broker or agent fee can ever apply
- ownership-verified or title-guaranteed claims
- obsolete fixed-fee or time-limited paid-listing claims
- paid listing subscription claims

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
