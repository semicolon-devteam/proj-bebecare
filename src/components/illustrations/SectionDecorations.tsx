'use client';

// Small decorative SVGs for section headers
export function BabyBottleDecor({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="7" y="3" width="6" height="3" rx="1" fill="#D4A0B0" opacity="0.5" />
      <rect x="5" y="6" width="10" height="12" rx="3" fill="#F8D0DA" stroke="#D4A0B0" strokeWidth="1" />
      <line x1="7" y1="10" x2="13" y2="10" stroke="#D4A0B0" strokeWidth="0.8" opacity="0.4" />
      <line x1="7" y1="13" x2="13" y2="13" stroke="#D4A0B0" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

export function HeartDecor({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 14 Q2 9 2 5.5 Q2 2 5 2 Q8 2 8 5 Q8 2 11 2 Q14 2 14 5.5 Q14 9 8 14Z"
        fill="#F8D0DA"
        stroke="#C2728A"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function StarDecor({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M7 1 L8.5 5 L13 5.5 L9.5 8.5 L10.5 13 L7 10.5 L3.5 13 L4.5 8.5 L1 5.5 L5.5 5Z"
        fill="#A3BDA8"
        opacity="0.6"
      />
    </svg>
  );
}

export function LeafDecor({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={className}>
      <path
        d="M4 14 Q2 8 9 3 Q16 8 14 14"
        stroke="#7C9A82"
        strokeWidth="1.2"
        fill="#A3BDA8"
        opacity="0.4"
      />
      <path d="M9 3 Q9 9 9 14" stroke="#7C9A82" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

export function CloudDecor({ className = '' }: { className?: string }) {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" fill="none" className={className}>
      <path
        d="M6 14 Q1 14 1 10 Q1 7 4 6 Q4 2 9 2 Q13 2 14 5 Q15 3 18 3 Q22 3 22 7 Q24 8 24 10 Q24 14 19 14Z"
        fill="#F8D0DA"
        opacity="0.3"
      />
    </svg>
  );
}

export function SparkleGroup({ className = '' }: { className?: string }) {
  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none" className={className}>
      <circle cx="5" cy="10" r="1.5" fill="#D4A0B0" opacity="0.4" />
      <circle cx="16" cy="4" r="2" fill="#A3BDA8" opacity="0.3" />
      <circle cx="27" cy="12" r="1.5" fill="#D4A0B0" opacity="0.5" />
      <circle cx="12" cy="16" r="1" fill="#F8D0DA" opacity="0.6" />
      <circle cx="22" cy="6" r="1" fill="#A3BDA8" opacity="0.4" />
    </svg>
  );
}
