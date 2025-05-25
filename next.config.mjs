/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be polyfilled
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
  // Disable font optimization temporarily
  optimizeFonts: false,
  // Add transpilePackages if needed
  transpilePackages: ['@prisma/client'],
}

export default nextConfig
