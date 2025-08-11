// PostCSS config compatible with Next.js expectations
// Prefer Tailwind v4 plugin; fall back to classic 'tailwindcss' if needed
const plugins = {}

try {
  require.resolve('@tailwindcss/postcss')
  plugins['@tailwindcss/postcss'] = {}
} catch (e) {
  plugins['tailwindcss'] = {}
}

plugins.autoprefixer = {}

module.exports = { plugins }