import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BhoomiMitra — Property Marketplace Across India',
    short_name: 'BhoomiMitra',
    description:
      'Indian property marketplace for sale, rent and lease. Direct seller contact, no current platform listing fee, 0% platform brokerage, and interactive mapping.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF9933',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
  };
}
