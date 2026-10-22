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
        // Ecosystem App Brand Colors from Monogram & Guidelines
        brand: {
          blue: {
            DEFAULT: '#2988C6', // Monogram Blue
            50: '#f0f7fc',
            100: '#ddedf8',
            200: '#c1e0f3',
            300: '#94c9eb',
            400: '#4da0d5',
            500: '#2988C6',
            600: '#2072a7',
            700: '#1b5f8b',
            800: '#1a5074',
            900: '#1a4461',
            950: '#102a3f',
          },
          green: {
            DEFAULT: '#66B151', // Monogram Green
            50: '#f3fbf0',
            100: '#e4f6dc',
            200: '#ccedbc',
            300: '#abdf92',
            400: '#7bc164',
            500: '#66B151',
            600: '#539b3f',
            700: '#417a32',
            800: '#37622b',
            900: '#2f5226',
            950: '#152d10',
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
