/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",   // Docker 배포용 최소 런타임
};

export default nextConfig;
