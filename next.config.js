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
    const WWW = 'https://autoescuelaamericana.com';
    return [
      { source: '/catalogo',          destination: `${WWW}/cursos`,           permanent: true },
      { source: '/english-course',    destination: `${WWW}/english`,          permanent: true },
      { source: '/programa',          destination: `${WWW}/programa`,         permanent: true },
      { source: '/blog',              destination: `${WWW}/blog`,             permanent: true },
      { source: '/blog/:slug*',       destination: `${WWW}/blog/:slug*`,      permanent: true },
      { source: '/terminos',          destination: `${WWW}/terminos`,         permanent: true },
      { source: '/aviso-privacidad',  destination: `${WWW}/aviso-privacidad`, permanent: true },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: '/ficha', destination: '/ficha.html' },
      ],
    };
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
