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
};

module.exports = nextConfig;
