import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BebeCare - 임신·출산·육아 슈퍼앱',
  description: 'AI 기반 맞춤 정보 제공 - 임신부터 육아까지 모든 정보를 한 곳에서',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
