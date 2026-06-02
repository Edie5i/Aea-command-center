/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  async redirects() {
    return [
      { source: '/ficha', destination: '/ficha.html', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // HTML pages: no CDN cache — deploy inmediato sin esperar purge de Fastly
        source: '/((?!_next/static|_next/image|favicon|icons|manifest).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Surrogate-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
