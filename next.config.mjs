/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    domains: ['firebasestorage.googleapis.com' , 'avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  env: {
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
  },
};

export default nextConfig;
