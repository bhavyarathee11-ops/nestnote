/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Add this line
  images: {
    domains: ['localhost', '*.supabase.co'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig