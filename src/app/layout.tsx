import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BebeCare - 임신·출산·육아 슈퍼앱',
  description: 'AI 기반 맞춤 정보 제공 - 임신부터 육아까지 모든 정보를 한 곳에서',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BebeCare',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#C2728A',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
