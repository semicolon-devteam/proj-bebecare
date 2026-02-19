'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/explore?tab=vaccination');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <LoadingSpinner text="페이지를 이동 중..." />
    </div>
  );
}