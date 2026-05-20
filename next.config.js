/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/ficha', destination: '/ficha.html' },
      ],
    };
  },
};

module.exports = nextConfig;
