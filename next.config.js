const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "famio.us" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

module.exports = nextConfig;
