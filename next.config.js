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

  // Proxy Firebase Auth's helper endpoints through our own domain so that the
  // Google sign-in consent screen reads "continue to medibot-ai.com" instead of
  // "<project>.firebaseapp.com". This only matters once
  // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set to medibot-ai.com; until then these
  // routes are simply never hit, so adding them is harmless.
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://medibot-457514.firebaseapp.com/__/auth/:path*",
      },
      {
        source: "/__/firebase/:path*",
        destination: "https://medibot-457514.firebaseapp.com/__/firebase/:path*",
      },
    ];
  },
};

module.exports = nextConfig;