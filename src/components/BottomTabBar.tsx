'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, MessageCircle, BookOpen, Menu } from 'lucide-react';

const tabs = [
  { id: 'home', path: '/', label: '홈', icon: Home },
  { id: 'log', path: '/log', label: '기록', icon: ClipboardList },
  { id: 'chat', path: '/chat', label: 'AI상담', icon: MessageCircle },
  { id: 'explore', path: '/explore', label: '정보', icon: BookOpen },
  { id: 'more', path: '/more', label: '더보기', icon: Menu },
];

interface BottomTabBarProps {
  isVisible: boolean;
}

export default function BottomTabBar({ isVisible }: BottomTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border safe-area-inset-bottom" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="flex h-16 px-3">
        {tabs.map(({ id, path, label, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <button
              key={id}
              data-tour={`tab-${id}`}
              onClick={() => router.push(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all ${
                isActive 
                  ? 'text-dusty-rose' 
                  : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <span className={`flex items-center justify-center h-7 w-7 rounded-full transition-all ${
                isActive ? 'bg-dusty-rose/10' : ''
              }`}>
                <Icon className={`${isActive ? 'h-[18px] w-[18px]' : 'h-5 w-5'}`} />
              </span>
              <span className={`text-[10px] font-semibold ${
                isActive ? 'text-dusty-rose' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
}