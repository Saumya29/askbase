/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    outputFileTracingIncludes: {
      "/api/upload": ["./node_modules/pdf-parse/dist/worker/pdf.worker.mjs"],
    },
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    }
  }
};

export default nextConfig;
