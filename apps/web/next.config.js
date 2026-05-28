/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  transpilePackages: ['@projecthub/shared'],
  // Proxy API requests to the Fastify backend.
  // In dev, set NEXT_PUBLIC_API_URL=http://localhost:4000
  // In production, set API_PROXY_TARGET to your deployed backend URL.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    if (!target) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
