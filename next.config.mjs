/** @type {import('next').NextConfig} */
const nextConfig = {
  // El Router Cache del cliente servia datos viejos al navegar por el menu del
  // admin (habia que apretar F5). Con dynamic:0 cada navegacion a una pagina
  // dinamica vuelve a pedir los datos frescos al servidor.
  experimental: {
    staleTimes: { dynamic: 0, static: 180 },
  },
  images: {
	remotePatterns: [
  	{ protocol: 'https', hostname: '**.supabase.co' },
  	{ protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
  	{ protocol: 'https', hostname: 'images.unsplash.com' }
	]
  }
};

export default nextConfig;

