'use client';

interface EmptyStateIllustrationProps {
  type: 'no-records' | 'no-stats' | 'no-timeline' | 'no-search' | 'no-children';
  className?: string;
}

export default function EmptyStateIllustration({ type, className = '' }: EmptyStateIllustrationProps) {
  const size = 140;

  switch (type) {
    case 'no-records':
      return (
        <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true" role="presentation">
          {/* Sleeping baby with notebook */}
          <circle cx="70" cy="70" r="65" fill="#FEF7F2" />
          {/* Notebook */}
          <rect x="35" y="50" width="40" height="50" rx="4" fill="#fff" stroke="#D4A0B0" strokeWidth="1.5" />
          <line x1="45" y1="62" x2="65" y2="62" stroke="#E5D5CF" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="45" y1="70" x2="60" y2="70" stroke="#E5D5CF" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="45" y1="78" x2="63" y2="78" stroke="#E5D5CF" strokeWidth="1.5" strokeLinecap="round" />
          {/* Pencil */}
          <rect x="78" y="42" width="6" height="36" rx="2" fill="#F8D0DA" stroke="#C2728A" strokeWidth="1" transform="rotate(15 78 42)" />
          <polygon points="78,78 81,88 84,78" fill="#C2728A" transform="rotate(15 81 78)" />
          {/* Small stars */}
          <circle cx="95" cy="35" r="2" fill="#D4A0B0" opacity="0.5" />
          <circle cx="105" cy="50" r="1.5" fill="#A3BDA8" opacity="0.5" />
          <circle cx="30" cy="40" r="1.5" fill="#D4A0B0" opacity="0.4" />
          {/* Dotted circle accent */}
          <circle cx="70" cy="70" r="62" stroke="#D4A0B0" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
        </svg>
      );

    case 'no-stats':
      return (
        <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true" role="presentation">
          <circle cx="70" cy="70" r="65" fill="#FEF7F2" />
          {/* Bar chart placeholder */}
          <rect x="30" y="80" width="14" height="25" rx="4" fill="#F8D0DA" />
          <rect x="50" y="65" width="14" height="40" rx="4" fill="#D4A0B0" />
          <rect x="70" y="72" width="14" height="33" rx="4" fill="#F8D0DA" />
          <rect x="90" y="55" width="14" height="50" rx="4" fill="#A3BDA8" />
          {/* Magnifying glass */}
          <circle cx="85" cy="38" r="12" stroke="#C2728A" strokeWidth="2" fill="none" />
          <line x1="93" y1="47" x2="102" y2="56" stroke="#C2728A" strokeWidth="2.5" strokeLinecap="round" />
          {/* Question mark inside magnifier */}
          <text x="82" y="43" fontSize="14" fill="#C2728A" fontWeight="bold">?</text>
          <circle cx="70" cy="70" r="62" stroke="#D4A0B0" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
        </svg>
      );

    case 'no-timeline':
      return (
        <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true" role="presentation">
          <circle cx="70" cy="70" r="65" fill="#FEF7F2" />
          {/* Timeline dots */}
          <circle cx="50" cy="40" r="6" fill="#F8D0DA" stroke="#D4A0B0" strokeWidth="1.5" />
          <circle cx="70" cy="60" r="6" fill="#A3BDA8" stroke="#7C9A82" strokeWidth="1.5" />
          <circle cx="90" cy="80" r="6" fill="#F8D0DA" stroke="#D4A0B0" strokeWidth="1.5" />
          {/* Connecting lines */}
          <line x1="54" y1="44" x2="66" y2="56" stroke="#E5D5CF" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="74" y1="64" x2="86" y2="76" stroke="#E5D5CF" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Seedling */}
          <path d="M65 95 Q65 85 70 82 Q75 85 75 95" stroke="#7C9A82" strokeWidth="1.5" fill="#A3BDA8" opacity="0.6" />
          <line x1="70" y1="95" x2="70" y2="105" stroke="#7C9A82" strokeWidth="1.5" />
          <circle cx="70" cy="70" r="62" stroke="#D4A0B0" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
        </svg>
      );

    case 'no-children':
      return (
        <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true" role="presentation">
          <circle cx="70" cy="70" r="65" fill="#FEF7F2" />
          {/* Baby face outline */}
          <circle cx="70" cy="58" r="22" stroke="#D4A0B0" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          {/* Closed eyes (sleeping) */}
          <path d="M60 55 Q63 58 66 55" stroke="#C2728A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M74 55 Q77 58 80 55" stroke="#C2728A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Smile */}
          <path d="M64 64 Q70 69 76 64" stroke="#C2728A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Plus sign */}
          <circle cx="100" cy="85" r="12" fill="#A3BDA8" opacity="0.2" />
          <line x1="95" y1="85" x2="105" y2="85" stroke="#7C9A82" strokeWidth="2" strokeLinecap="round" />
          <line x1="100" y1="80" x2="100" y2="90" stroke="#7C9A82" strokeWidth="2" strokeLinecap="round" />
          <circle cx="70" cy="70" r="62" stroke="#D4A0B0" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
        </svg>
      );

    case 'no-search':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 140 140" fill="none" className={className} aria-hidden="true" role="presentation">
          <circle cx="70" cy="70" r="65" fill="#FEF7F2" />
          {/* Magnifying glass */}
          <circle cx="60" cy="58" r="20" stroke="#D4A0B0" strokeWidth="2.5" fill="none" />
          <line x1="74" y1="72" x2="95" y2="93" stroke="#D4A0B0" strokeWidth="3" strokeLinecap="round" />
          {/* Small dots */}
          <circle cx="55" cy="52" r="2" fill="#F8D0DA" />
          <circle cx="65" cy="48" r="1.5" fill="#A3BDA8" />
          <circle cx="58" cy="62" r="1.5" fill="#F8D0DA" />
          <circle cx="70" cy="70" r="62" stroke="#D4A0B0" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
        </svg>
      );
  }
}
