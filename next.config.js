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
      // Redirigir el home al sitio de marketing (www) — ads y tráfico general llegan aquí
      { source: '/', destination: 'https://www.autoescuelaamericana.com', permanent: false },
    ];
  },
};

module.exports = nextConfig;
