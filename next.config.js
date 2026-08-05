/** @type {import('next').NextConfig} */
const leakTestDistDir = process.env.LEAK_TEST_DIST_DIR?.trim();

if (leakTestDistDir && leakTestDistDir !== ".next-leak-test") {
  throw new Error("LEAK_TEST_DIST_DIR must be .next-leak-test when set");
}

const nextConfig = {
  // The privacy leak gate builds into an isolated directory so running the
  // test cannot replace the production artifact in `.next`.
  distDir: leakTestDistDir || ".next",
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
