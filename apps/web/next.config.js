/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-job-agent/shared'],
  env: {
    NEXT_PUBLIC_API_URL: 'https://br-empty-tooth-b46jpbjc-backend.compute.c-6.us-east-2.aws.neon.tech/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://br-empty-tooth-b46jpbjc-backend.compute.c-6.us-east-2.aws.neon.tech/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
