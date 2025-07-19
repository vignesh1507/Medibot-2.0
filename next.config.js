/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dygmrde1v/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'medibot-ai-two.vercel.app',
          },
        ],
        destination: 'https://medibot-ai.com',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
