import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bhoomimitra.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/buy',
          '/sell',
          '/pricing',
          '/about',
          '/contact',
          '/listing-rules',
          '/privacy',
          '/terms',
          '/refund-policy',
          '/properties/',
          '/llms.txt',
          '/llms-full.txt',
          '/manifest.webmanifest',
        ],
        disallow: [
          '/admin',
          '/admin/',
          '/dashboard',
          '/dashboard/',
          '/profile',
          '/profile/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
