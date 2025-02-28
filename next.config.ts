/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: {
    resolve: {
      fallback: Record<string, boolean>;
    };
  }, { isServer }: { isServer: boolean }) => {
    // Add handling for Firebase modules
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "fs": false,
        "net": false,
        "tls": false,
        "crypto": false,
      };
    }
    return config;
  },
};

export default nextConfig;
