import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Agregamos esta línea para la exportación estática
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
