'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'heart' | 'star';
  delay: number;
  size: number;
}

interface CelebrationEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function CelebrationEffect({ trigger, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      type: Math.random() > 0.5 ? 'heart' : 'star',
      delay: Math.random() * 200,
      size: 8 + Math.random() * 8,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-celebration-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}ms`,
            color: p.type === 'heart' ? '#C2728A' : '#7C9A82',
          }}
        >
          {p.type === 'heart' ? (
            <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 14 Q2 9 2 5.5 Q2 2 5 2 Q8 2 8 5 Q8 2 11 2 Q14 2 14 5.5 Q14 9 8 14Z" />
            </svg>
          ) : (
            <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1 L9.5 5.5 L14 6 L10.5 9 L11.5 14 L8 11.5 L4.5 14 L5.5 9 L2 6 L6.5 5.5Z" />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}
