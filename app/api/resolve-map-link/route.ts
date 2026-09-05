import { NextRequest, NextResponse } from 'next/server';

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

  return { latitude, longitude, placeName };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rawUrl = body?.url?.trim();

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid Google Maps URL or coordinates' },
        { status: 400 }
      );
    }

    // Direct raw coordinate format check: "17.6202, 77.7980"
    const rawCoordMatch = rawUrl.match(
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
          resolvedUrl: rawUrl,
        });
      }
    }

    let currentUrl = rawUrl;
    if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
      currentUrl = `https://${currentUrl}`;
    }

    // Follow redirect headers if it is a shortened URL (e.g., maps.app.goo.gl, goo.gl)
    const MAX_REDIRECTS = 5;
    let redirectCount = 0;

    while (
      (currentUrl.includes('goo.gl') ||
        currentUrl.includes('maps.app') ||
        currentUrl.includes('bit.ly')) &&
      redirectCount < MAX_REDIRECTS
    ) {
      redirectCount++;
      try {
        const response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        const locationHeader = response.headers.get('location');
        if (locationHeader) {
          currentUrl = locationHeader;
        } else {
          break;
        }
      } catch (err) {
        console.warn('Redirect fetch error for map URL:', err);
        break;
      }
    }

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

    // Fallback: If place name exists but coordinates couldn't be parsed from URL,
    // geocode using Nominatim
    if (placeName) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            placeName
          )}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'BhoomiMitra-App/1.0 (support@bhoomimitra.com)',
            },
          }
        );
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lng = parseFloat(geoData[0].lon);
          return NextResponse.json({
            success: true,
            latitude: lat,
            longitude: lng,
            placeName: geoData[0].display_name?.split(',')[0] || placeName,
            resolvedUrl: currentUrl,
          });
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
  } catch (error) {
    console.error('Failed to resolve map link:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while resolving map link' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get('url');
  if (!urlParam) {
    return NextResponse.json({ success: false, error: 'Missing url parameter' }, { status: 400 });
  }

  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ url: urlParam }),
      headers: { 'Content-Type': 'application/json' },
    })
  );
}
