import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import dotenv from "dotenv";
import path from "path";

// Support staging environment in Next.js
if (process.env.APP_ENV === "staging") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.staging.local"), override: true });
  dotenv.config({ path: path.resolve(process.cwd(), ".env.staging"), override: true });
}

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  output: "standalone",
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
