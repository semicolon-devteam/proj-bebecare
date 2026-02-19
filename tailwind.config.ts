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
        primary: '#C2728A', // Dusty Rose (브랜드 주색상)
        secondary: '#7C9A82', // Sage Green (브랜드 보조색상)
        success: '#10B981', // 초록색 (완료)
        warning: '#EF4444', // 빨간색 (높은 우선순위)
      },
    },
  },
  plugins: [],
};

export default config;
