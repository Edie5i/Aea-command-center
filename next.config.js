/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  },

  // El QR de WhatsApp en /pagos se genera en api.qrserver.com. Sin declarar el
  // host, next/image lanza "Invalid src prop" y la página entera responde 500.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },

  async redirects() {
    const WWW = 'https://autoescuelaamericana.com';
    return [
      // /ficha era el "Generador de Fichas" (public/ficha.html): el PDF suelto
      // que se bajaba del navegador. Se borró cuando la ficha pasó a ser una
      // sola, la que vive en Firestore y se actualiza sola, pero la costumbre
      // —y los bookmarks— siguen apuntando ahí, y ahí no quedó nada: 404. La
      // captura de mostrador vive en /admin/ficha-nueva y pide el PIN.
      // Temporal (307) a propósito: no se cachea para siempre en el navegador
      // por si /ficha llega a servir otra cosa.
      { source: '/ficha',             destination: '/admin/ficha-nueva',      permanent: false },
      { source: '/ficha.html',        destination: '/admin/ficha-nueva',      permanent: false },
      { source: '/catalogo',          destination: `${WWW}/cursos`,           permanent: true },
      { source: '/english-course',    destination: `${WWW}/english`,          permanent: true },
      { source: '/programa',          destination: `${WWW}/programa`,         permanent: true },
      { source: '/blog',              destination: `${WWW}/blog`,             permanent: true },
      { source: '/blog/:slug*',       destination: `${WWW}/blog/:slug*`,      permanent: true },
      { source: '/terminos',          destination: `${WWW}/terminos`,         permanent: true },
      { source: '/aviso-privacidad',  destination: `${WWW}/aviso-privacidad`, permanent: true },
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
