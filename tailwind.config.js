/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // theme key is deprecated in v4
  variables: {
    // define css variables
    'font-sans': 'var(--font-inter)',
    'font-display': 'var(--font-poppins)',

    colors: {
      background: '#F8F9FA',
      foreground: '#1A202C',
      muted: '#718096',
      primary: {
        DEFAULT: '#4A90E2',
        hover: '#357ABD',
      },
      card: '#FFFFFF',
      border: '#E2E8F0',
    }
  },
  plugins: [],
}

export default config;
