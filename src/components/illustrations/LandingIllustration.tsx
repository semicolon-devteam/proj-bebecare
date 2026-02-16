'use client';

export default function LandingIllustration({ className = '' }: { className?: string }) {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" className={className}>
      {/* Background circle */}
      <circle cx="80" cy="80" r="75" fill="#FEF0E8" />
      <circle cx="80" cy="80" r="72" stroke="#D4A0B0" strokeWidth="1" strokeDasharray="6 4" opacity="0.3" />
      
      {/* Moon/cradle shape */}
      <path
        d="M40 95 Q40 65 80 55 Q120 65 120 95"
        stroke="#D4A0B0"
        strokeWidth="2"
        fill="#FFF5F0"
      />
      
      {/* Baby in cradle */}
      {/* Head */}
      <circle cx="80" cy="68" r="16" fill="#FFDDD2" stroke="#C2728A" strokeWidth="1.5" />
      {/* Closed eyes (sleeping peacefully) */}
      <path d="M73 66 Q76 69 79 66" stroke="#A85C73" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M81 66 Q84 69 87 66" stroke="#A85C73" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M76 73 Q80 76 84 73" stroke="#C2728A" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <circle cx="72" cy="71" r="3" fill="#F8C0C0" opacity="0.4" />
      <circle cx="88" cy="71" r="3" fill="#F8C0C0" opacity="0.4" />
      
      {/* Blanket body */}
      <ellipse cx="80" cy="90" rx="22" ry="12" fill="#F8D0DA" stroke="#D4A0B0" strokeWidth="1" />
      
      {/* Small arms peeking */}
      <path d="M62 85 Q56 82 58 78" stroke="#FFDDD2" strokeWidth="3" strokeLinecap="round" />
      <path d="M98 85 Q104 82 102 78" stroke="#FFDDD2" strokeWidth="3" strokeLinecap="round" />
      
      {/* Stars around */}
      <g opacity="0.5">
        <path d="M30 40 L31.5 44 L36 44.5 L32.5 47 L33.5 51 L30 48.5 L26.5 51 L27.5 47 L24 44.5 L28.5 44Z" fill="#D4A0B0" />
        <path d="M120 30 L121 33 L124 33.3 L121.5 35 L122.2 38 L120 36.5 L117.8 38 L118.5 35 L116 33.3 L119 33Z" fill="#A3BDA8" />
        <circle cx="130" cy="55" r="2" fill="#D4A0B0" />
        <circle cx="25" cy="60" r="1.5" fill="#A3BDA8" />
      </g>
      
      {/* Small hearts */}
      <path d="M45 30 Q42 26 45 24 Q48 26 48 30 Q48 26 51 24 Q54 26 51 30 Q48 34 48 34 Q45 34 45 30Z" fill="#F8D0DA" opacity="0.6" />
      <path d="M110 45 Q108 42 110 41 Q112 42 112 45 Q112 42 114 41 Q116 42 114 45 Q112 48 112 48 Q110 48 110 45Z" fill="#A3BDA8" opacity="0.5" />
      
      {/* Zzz */}
      <text x="100" y="55" fontSize="10" fill="#D4A0B0" opacity="0.5" fontWeight="bold">z</text>
      <text x="108" y="48" fontSize="8" fill="#D4A0B0" opacity="0.4" fontWeight="bold">z</text>
      <text x="114" y="42" fontSize="6" fill="#D4A0B0" opacity="0.3" fontWeight="bold">z</text>
    </svg>
  );
}
