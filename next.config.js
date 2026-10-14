/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/:path*`,
      },
      {
        source: '/cappuccinostudiox/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/cappuccinostudiox/:path*`,
      },
      // ── MVP route aliases ─────────────────────────────────────────────────
      // Map the documented route names (LUCID_JUNGLES_TECHNICAL_ARCHITECTURE.md)
      // onto the canonical pages. Param names are preserved so dynamic pages
      // keep reading the same query keys.
      { source: '/u/:username', destination: '/:username' },
      { source: '/creator/:username', destination: '/:username' },
      { source: '/communities', destination: '/fanbase' },
      { source: '/communities/:fanbaseId', destination: '/fanbase/:fanbaseId' },
      { source: '/tickets', destination: '/tkxts/mytickets' },
      { source: '/onboarding', destination: '/dojo/onboarding' },
    ];
  },
};

module.exports = nextConfig;
