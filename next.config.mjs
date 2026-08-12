const allowedOrigins = ["localhost:3000", "127.0.0.1:3000", "localhost:3001", "127.0.0.1:3001"];

if (process.env.VERCEL_URL) {
  allowedOrigins.push(process.env.VERCEL_URL);
}

if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    allowedOrigins.push(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
  } catch {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "").replace(/\/.*$/, ""));
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dercocenter-api.s3.us-east-1.amazonaws.com"
      }
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins
    }
  }
};

export default nextConfig;
