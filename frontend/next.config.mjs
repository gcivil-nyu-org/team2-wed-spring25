/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['leaflet', 'leaflet-routing-machine'],
    images: {
        domains: ['randomuser.me', 'picsum.photos', 'res.cloudinary.com', 'lh3.googleusercontent.com'], // Add the domain(s) you want to allow
      },
};

export default nextConfig;
