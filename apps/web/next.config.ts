import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@gas-station/shared-types'],
};

export default nextConfig;
