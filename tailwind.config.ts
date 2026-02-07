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
        primary: '#3B82F6', // 파란색 (건강)
        secondary: '#F59E0B', // 주황색 (보험)
        success: '#10B981', // 초록색 (완료)
        warning: '#EF4444', // 빨간색 (높은 우선순위)
      },
    },
  },
  plugins: [],
};

export default config;
