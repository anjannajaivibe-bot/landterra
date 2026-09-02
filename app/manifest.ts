import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BhoomiMitra — Direct Land & Plot Marketplace',
    short_name: 'BhoomiMitra',
    description:
      'Direct-to-owner Indian land and plot marketplace. Verified revenue records, 0% brokerage commission, and interactive satellite mapping.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#047857',
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
