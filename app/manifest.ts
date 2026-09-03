import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BhoomiMitra — Direct Land & Plot Marketplace',
    short_name: 'BhoomiMitra',
    description:
      'Direct-to-owner Indian land and plot marketplace. Direct peer-to-peer listings, 0% brokerage commission, and interactive satellite mapping.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF9933',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
  };
}
