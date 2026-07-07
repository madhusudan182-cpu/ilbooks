import type { NextConfig } from 'next';


const nextConfig: NextConfig = {
  /* config options here */
  // ১. প্রোডাকশনে কনসোল লগ রিমুভ করার রুলস যোগ করা হলো
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // error এবং warn বাদে সব সাধারণ .log() মুছে যাবে
    } : false,
  },
  output: 'standalone',


  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placeholder.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '://unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://hosted.app*',
      },
    ];
  },
};

export default nextConfig;
