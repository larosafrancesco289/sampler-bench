/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // App Router is now stable, no experimental config needed
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    }
    return config
  },
}

module.exports = nextConfig 