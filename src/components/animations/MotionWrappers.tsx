'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

// Fade + slide up for card entrance
export function FadeInUp({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children
export function StaggerContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale pop for check actions
export function ScalePop({ children, trigger, className = '' }: { children: ReactNode; trigger: boolean; className?: string }) {
  return (
    <motion.div
      animate={trigger ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Tab content transition
export function TabContent({ children, tabKey, className = '' }: { children: ReactNode; tabKey: string; className?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Skeleton pulse block
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
  );
}

// Cute loading indicator
export function CuteLoader({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="17" stroke="#F0E6E0" strokeWidth="3" />
            <path
              d="M20 3 A17 17 0 0 1 37 20"
              stroke="#C2728A"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
        {/* Small heart in center */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="#C2728A">
            <path d="M8 14 Q2 9 2 5.5 Q2 2 5 2 Q8 2 8 5 Q8 2 11 2 Q14 2 14 5.5 Q14 9 8 14Z" />
          </svg>
        </motion.div>
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

// Card loading skeleton
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
