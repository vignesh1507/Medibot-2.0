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
            value: 'medibot-ai',
          },
        ],
        destination: 'medibot-ai-two.vercel.app',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
