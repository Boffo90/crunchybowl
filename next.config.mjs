/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
	remotePatterns: [
  	{ protocol: 'https', hostname: '**.supabase.co' },
  	{ protocol: 'https', hostname: 'oaidalleapiprodscus.blob.core.windows.net' },
  	{ protocol: 'https', hostname: 'images.unsplash.com' }
	]
  }
};

export default nextConfig;

