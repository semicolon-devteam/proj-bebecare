import type { Metadata } from 'next';
import './globals.css';
import TimerBar from '@/components/Timer';
import BottomTabBar from '@/components/BottomTabBar';
import LayoutWrapper from '@/components/LayoutWrapper';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  openGraph: {
    title: 'BebeCare - 임신·출산·육아 슈퍼앱',
    description: 'AI 기반 맞춤 정보 제공 - 임신부터 육아까지 모든 정보를 한 곳에서',
    url: SITE_URL,
    siteName: 'BebeCare',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'BebeCare - 임신·출산·육아 슈퍼앱' }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BebeCare - 임신·출산·육아 슈퍼앱',
    description: 'AI 기반 맞춤 정보 제공 - 임신부터 육아까지 모든 정보를 한 곳에서',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
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
      <body className="antialiased">
        <TimerBar />
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
