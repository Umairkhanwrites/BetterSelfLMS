import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ecosystem App Brand Colors from Guidelines
        brand: {
          blue: {
            DEFAULT: '#3B97D3', // Core Trust & Stability
            50: '#f0f7fc',
            100: '#ddedf8',
            200: '#c1e0f3',
            300: '#94c9eb',
            400: '#5faee0',
            500: '#3B97D3',
            600: '#277cb7',
            700: '#206394',
            800: '#1e547b',
            900: '#1d4666',
            950: '#102a3f',
          },
          green: {
            DEFAULT: '#7CC157', // Growth, Renewal & Actionable Buttons
            50: '#f3fbf0',
            100: '#e4f6dc',
            200: '#ccedbc',
            300: '#abdf92',
            400: '#8acc68',
            500: '#7CC157',
            600: '#5ea33c',
            700: '#487d30',
            800: '#3c642a',
            900: '#345326',
            950: '#182f11',
          },
          accent: {
            DEFAULT: '#F4A261', // Action Accent (Urgency, Notifications, Alerts)
            50: '#fdf8f3',
            100: '#fbf0e3',
            200: '#f6dec4',
            300: '#f0c49b',
            400: '#e99f69',
            500: '#F4A261',
            600: '#da7e3e',
            700: '#b5602e',
            800: '#904e2b',
            900: '#754227',
            950: '#422110',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
