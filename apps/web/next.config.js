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
    // Only rewrite to the external API backend if one is configured.
    // If API_PROXY_TARGET or NEXT_PUBLIC_API_URL are NOT set, the local
    // catch-all route at app/api/v1/[...slug]/route.ts handles the requests directly
    // (this is the Vercel serverless mode — no separate Fastify backend needed).
    const target = process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL;
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
