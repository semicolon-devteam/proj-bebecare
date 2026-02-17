import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'BebeCare - 임신·출산·육아 슈퍼앱'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #C2728A 0%, #E8A0B4 50%, #F5D5DE 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 20,
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
          }}
        >
          🍼 BebeCare
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#FFFFFF',
            opacity: 0.95,
            display: 'flex',
          }}
        >
          임신·출산·육아 슈퍼앱
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#FFFFFF',
            opacity: 0.8,
            marginTop: 16,
            display: 'flex',
          }}
        >
          AI 기반 맞춤 정보 제공
        </div>
      </div>
    ),
    { ...size }
  )
}
