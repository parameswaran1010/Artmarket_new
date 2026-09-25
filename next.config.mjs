/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage — artwork images uploaded by artists
      {
        protocol: "https",
        hostname: "wmxprdeqcogmgurnykmu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash — sample artwork images used in the upload page
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
