import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Strict allowlist of legitimate Google Maps hostnames
const ALLOWED_MAP_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
  'maps.google.co.in',
  'www.google.co.in',
  'google.co.in',
]);

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Checks if an IP address falls within private, loopback, link-local, or reserved ranges.
 */
function isPrivateIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return true;

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  let normalizedIp = ip.trim();
  if (normalizedIp.startsWith('::ffff:')) {
    normalizedIp = normalizedIp.substring(7);
  }

  // IPv6 loopback / unspecified
  if (normalizedIp === '::1' || normalizedIp === '::') return true;

  const lower = normalizedIp.toLowerCase();
  // IPv6 unique local (fc00::/7) or link-local (fe80::/10)
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
    return true;
  }

  // Check if string matches IPv4 pattern (e.g. "1.2.3.4")
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = normalizedIp.match(ipv4Regex);
  if (!match) {
    // Not an IPv4 literal
    return false;
  }

  const p0 = parseInt(match[1], 10);
  const p1 = parseInt(match[2], 10);
  const p2 = parseInt(match[3], 10);
  const p3 = parseInt(match[4], 10);

  if (p0 > 255 || p1 > 255 || p2 > 255 || p3 > 255) {
    return true; // Invalid octet, block
  }

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;
  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;
  // 10.0.0.0/8 (Private)
  if (p0 === 10) return true;
  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (p0 === 192 && p1 === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud Metadata)
  if (p0 === 169 && p1 === 254) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  // 198.18.0.0/15 (Benchmark testing)
  if (p0 === 198 && (p1 === 18 || p1 === 19)) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (p0 >= 224) return true;

  return false;
}

/**
 * Resolves a hostname via DNS and checks whether any resolved address is private or internal.
 */
async function isPublicDnsHost(hostname: string): Promise<boolean> {
  // If hostname is directly an IP literal or localhost
  if (
    isPrivateIp(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    return false;
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }

    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        return false;
      }
    }
    return true;
  } catch {
    // DNS resolution failure (NXDOMAIN, timeout, etc.)
    return false;
  }
}

function parseCoordinatesFromUrl(targetUrl: string): {
  latitude: number | null;
  longitude: number | null;
  placeName: string | null;
} {
  let latitude: number | null = null;
  let longitude: number | null = null;
  let placeName: string | null = null;

  // 1. Google Maps protobuf coordinates: !3d17.6202104!4d77.7980376
  const dataMatch = targetUrl.match(/!3d([0-9.-]+)!4d([0-9.-]+)/);
  if (dataMatch) {
    latitude = parseFloat(dataMatch[1]);
    longitude = parseFloat(dataMatch[2]);
  }

  // 2. Center coordinates: @17.6164502,77.8002336
  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    const atMatch = targetUrl.match(/@([0-9.-]+),([0-9.-]+)/);
    if (atMatch) {
      latitude = parseFloat(atMatch[1]);
      longitude = parseFloat(atMatch[2]);
    }
  }

  // 3. Query params: ?q=17.6202,77.7980 or query=... or ll=...
  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    const qMatch = targetUrl.match(/[?&](?:q|query|ll|center)=([0-9.-]+),([0-9.-]+)/);
    if (qMatch) {
      latitude = parseFloat(qMatch[1]);
      longitude = parseFloat(qMatch[2]);
    }
  }

  // 4. Place name extraction from /place/Place+Name/
  const placeMatch = targetUrl.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    try {
      placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    } catch {
      placeName = placeMatch[1].replace(/\+/g, ' ');
    }
  }

  // Validate numeric bounds: lat [-90, 90], lng [-180, 180]
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    latitude = null;
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    longitude = null;
  }

  return { latitude, longitude, placeName };
}

/**
 * Validates a redirect target URL before following it.
 * Returns the normalized valid redirect URL string, or null if rejected.
 */
async function validateRedirectTarget(
  locationHeader: string,
  currentUrl: string
): Promise<string | null> {
  let nextUrl: URL;
  try {
    nextUrl = new URL(locationHeader, currentUrl);
  } catch {
    return null;
  }

  // Protocol check: strictly HTTPS only
  if (nextUrl.protocol !== 'https:') {
    return null;
  }

  // Standard port check (rejects internal port-scanning attempts)
  if (nextUrl.port && nextUrl.port !== '443') {
    return null;
  }

  // Credentials check
  if (nextUrl.username || nextUrl.password) {
    return null;
  }

  const nextHost = nextUrl.hostname.toLowerCase();

  // Hostname allowlist check
  if (!ALLOWED_MAP_HOSTS.has(nextHost)) {
    return null;
  }

  // Private IP check
  if (isPrivateIp(nextHost)) {
    return null;
  }

  // DNS resolution check (defense-in-depth against private IP targets)
  const isNextHostPublic = await isPublicDnsHost(nextHost);
  if (!isNextHostPublic) {
    return null;
  }

  return nextUrl.toString();
}

async function resolveMapLink(rawUrl: string, req: NextRequest): Promise<NextResponse> {
  // 1. Apply IP rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const { allowed } = checkRateLimit(`map-resolve:${ip}`, 30, 60000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.' },
      { status: 429 }
    );
  }

  // 2. Validate input presence
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return NextResponse.json(
      { success: false, error: 'Please provide a valid Google Maps URL or coordinates' },
      { status: 400 }
    );
  }

  // 3. Direct raw coordinate format check: "17.6202, 77.7980"
  const rawCoordMatch = trimmed.match(
    /^([+-]?\d{1,2}(?:\.\d+)?)[,\s]+([+-]?\d{1,3}(?:\.\d+)?)$/
  );
  if (rawCoordMatch) {
    const lat = parseFloat(rawCoordMatch[1]);
    const lng = parseFloat(rawCoordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return NextResponse.json({
        success: true,
        latitude: lat,
        longitude: lng,
        placeName: null,
        resolvedUrl: trimmed,
      });
    }
  }

  // 4. Parse and normalize initial URL
  let parsedUrl: URL;
  try {
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    } else if (normalized.toLowerCase().startsWith('http://')) {
      normalized = `https://${normalized.substring(7)}`;
    }
    parsedUrl = new URL(normalized);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid URL format' },
      { status: 400 }
    );
  }

  // 5. Enforce HTTPS only
  if (parsedUrl.protocol !== 'https:') {
    return NextResponse.json(
      { success: false, error: 'Only HTTPS URLs are permitted' },
      { status: 400 }
    );
  }

  // 6. Enforce standard HTTPS port only
  if (parsedUrl.port && parsedUrl.port !== '443') {
    return NextResponse.json(
      { success: false, error: 'Invalid URL port' },
      { status: 400 }
    );
  }

  // 7. Reject embedded credentials in URL
  if (parsedUrl.username || parsedUrl.password) {
    return NextResponse.json(
      { success: false, error: 'URLs with credentials are not permitted' },
      { status: 400 }
    );
  }

  // 8. Strict hostname allowlist validation
  const initialHost = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_MAP_HOSTS.has(initialHost)) {
    return NextResponse.json(
      { success: false, error: 'Only official Google Maps links are supported' },
      { status: 400 }
    );
  }

  // 9. Validate that initial hostname is not private/internal
  if (isPrivateIp(initialHost)) {
    return NextResponse.json(
      { success: false, error: 'Only official Google Maps links are supported' },
      { status: 400 }
    );
  }

  // 10. Validate public DNS resolution for initial hostname
  const isInitialHostPublic = await isPublicDnsHost(initialHost);
  if (!isInitialHostPublic) {
    return NextResponse.json(
      { success: false, error: 'Unable to resolve map host' },
      { status: 400 }
    );
  }

  // Check if coordinates can already be extracted without following redirects
  const initialCoords = parseCoordinatesFromUrl(parsedUrl.toString());
  if (
    initialCoords.latitude !== null &&
    initialCoords.longitude !== null &&
    !isNaN(initialCoords.latitude) &&
    !isNaN(initialCoords.longitude)
  ) {
    return NextResponse.json({
      success: true,
      latitude: initialCoords.latitude,
      longitude: initialCoords.longitude,
      placeName: initialCoords.placeName,
      resolvedUrl: parsedUrl.toString(),
    });
  }

  // 11. Follow redirects with strict per-hop validation (for shortened URLs)
  let currentUrl = parsedUrl.toString();
  let redirectCount = 0;

  while (redirectCount < MAX_REDIRECTS) {
    const currentParsed = new URL(currentUrl);
    const currentHost = currentParsed.hostname.toLowerCase();

    // Only shortened Google Maps domains need redirect following
    if (currentHost !== 'maps.app.goo.gl' && currentHost !== 'goo.gl') {
      break;
    }

    redirectCount++;

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
    } catch (fetchErr) {
      console.warn('Redirect fetch error for map URL:', fetchErr);
      break;
    }

    const locationHeader = response.headers.get('location');
    if (!locationHeader) {
      break;
    }

    const validNextUrl = await validateRedirectTarget(locationHeader, currentUrl);
    if (!validNextUrl) {
      console.warn('Blocked invalid or unsafe redirect target:', locationHeader);
      break;
    }

    currentUrl = validNextUrl;
  }

  // 12. Parse coordinates from the final resolved URL
  const { latitude, longitude, placeName } = parseCoordinatesFromUrl(currentUrl);

  if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      placeName,
      resolvedUrl: currentUrl,
    });
  }

  // 13. Fallback: Geocode using Nominatim if placeName was extracted
  if (placeName) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          placeName
        )}&format=json&limit=1`,
        {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: {
            'User-Agent': 'LandTerra-App/1.0 (support@landterra.com)',
          },
        }
      );
      const geoData = await geoRes.json();
      if (Array.isArray(geoData) && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return NextResponse.json({
            success: true,
            latitude: lat,
            longitude: lng,
            placeName: geoData[0].display_name?.split(',')[0] || placeName,
            resolvedUrl: currentUrl,
          });
        }
      }
    } catch (geoErr) {
      console.warn('Geocoding fallback failed:', geoErr);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error:
        'Could not extract GPS coordinates from this link. Please check the URL or select on the map.',
      resolvedUrl: currentUrl,
    },
    { status: 422 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rawUrl = typeof body?.url === 'string' ? body.url : '';
    return resolveMapLink(rawUrl, req);
  } catch (error) {
    console.error('Failed to resolve map link:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to resolve map link. Please enter details manually.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get('url') || '';
    return resolveMapLink(urlParam, req);
  } catch (error) {
    console.error('Failed to resolve map link:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to resolve map link. Please enter details manually.' },
      { status: 500 }
    );
  }
}
