/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  // Allow importing from workspace packages
  transpilePackages: ['@buzzfeed/api', '@buzzfeed/store', '@buzzfeed/utils'],
};

module.exports = nextConfig;
