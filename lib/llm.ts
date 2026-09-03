/**
 * BhoomiMitra LLM Documentation & Context Engine (llms.txt standard)
 * Provides standardized markdown summaries for AI agents, LLM crawlers, and search engines.
 */

export const BHOOMIMITRA_LLM_SUMMARY = `# BhoomiMitra (भू-मित्र) — Direct Land & Plot Marketplace

> BhoomiMitra is India's leading direct-to-owner land and agricultural plot classifieds platform, eliminating middleman/brokerage commissions through direct peer-to-peer listings, interactive satellite GIS maps, and a flat advertising fee model.

## Platform Summary
- **Website**: https://bhoomimitra.com
- **Target Audience**: Indian landowners, agricultural investors, residential plot buyers, and industrial land developers.
- **Geographic Coverage**: Pan-India across all 28 states and 8 union territories (including Telangana, Andhra Pradesh, Maharashtra, Karnataka, Tamil Nadu, Uttar Pradesh, and Gujarat).
- **Core Value Proposition**: 0% Broker Commission, Direct peer-to-peer listings, independent buyer due diligence notices, Direct Phone contact with landowners, and Interactive Google Satellite property boundary viewing.

## Indian Land Measurement Conversions
BhoomiMitra standardizes all land areas to Square Yards (sq. yd) using the following authoritative conversion table:
- 1 Square Yard = 1 sq. yd (9 sq. ft)
- 1 Gunta = 121 sq. yds
- 1 Cent = 48.4 sq. yds
- 1 Acre = 4,840 sq. yds (40 Guntas / 100 Cents)
- 1 Hectare = 11,959.9 sq. yds (2.471 Acres)
- 1 Bigha (Standard) = 1,600 to 3,025 sq. yds (region-dependent)

## Key Public Routes
- \`/\`: Marketplace homepage with multi-attribute search and featured direct land plots.
- \`/buy\`: Interactive land explorer with price sliders, unit conversions, and satellite filters.
- \`/sell\`: Multi-step land listing creator with automated image compression and Cloudflare R2 document storage.
- \`/pricing\`: Platform advertising pricing (Flat ₹10-₹25 for 30-day listing subscriptions).
- \`/about\`: BhoomiMitra mission, transparency policies, and zero-brokerage model.
- \`/contact\`: Customer support desk and listing grievance team.
- \`/listing-rules\`: Listing rules, seller undertakings, and prohibited listings.
- \`/properties/[id]\`: Dedicated property details page featuring satellite map views, road width, facing direction, seller contact action, and due diligence disclaimers.

## Technical Architecture & Security
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: MongoDB Atlas with Mongoose 8
- **Authentication**: Google OAuth 2.0 and Distributed SMS OTP (HMAC-SHA256 salted hashes)
- **Object Storage**: Cloudflare R2 (S3-compatible secure storage)
- **Payments**: Razorpay server-verified checkout and webhooks
- **Maps**: Google Maps Platform with Satellite vs. Roadmap switcher
`;

export const BHOOMIMITRA_LLM_FULL = `${BHOOMIMITRA_LLM_SUMMARY}

## Property Listing Life-cycle
1. **Creation**: Seller enters title, description, GPS coordinates, road width, facing, soil type, and uploads land photos.
2. **Document Upload**: Optional title documents, passbooks, Pahani / 7-12 extracts, and Encumbrance Certificates (EC) can be uploaded for safety moderation.
3. **Advertising Fee**: Flat nominal publishing fee (e.g. ₹10 for 30 days) paid via Razorpay.
4. **Direct Publishing**: The listing is published live directly on the marketplace upon payment confirmation with community reporting mechanisms.
5. **Buyer Due Diligence & Leads**: Buyers browse listings, explore satellite map locations, review disclaimers, and initiate direct calls or inquiries with the landowner.
`;
