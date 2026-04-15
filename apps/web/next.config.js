/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@timeflow/types', '@timeflow/db', '@timeflow/emails'],

  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  // Security & PWA headers
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type',  value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  // Redirect /sw.js to the public file (Next.js doesn't serve public/* at root by default in some configs)
  async rewrites() {
    return [
      { source: '/sw.js', destination: '/sw.js' },
    ]
  },
}

module.exports = nextConfig
