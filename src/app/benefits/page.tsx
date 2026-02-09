'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Benefit {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  subcategory: string | null;
  tags: string[] | null;
  relevanceScore: number;
  reasons: string[];
}

const subcategoryEmoji: Record<string, string> = {
  건강관리: '🏥',
  바우처: '💳',
  현금지원: '💰',
  세금: '📋',
};

export default function BenefitsPage() {
  const router = useRouter();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/benefits', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBenefits(data.benefits || []);
      }
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
      {/* Header */}
      <header className="bg-pink-500 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg px-2 py-1 text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-black text-white">🏛️ 정부지원 혜택</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        {/* Info Banner */}
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-gray-600">
            🎯 회원님의 프로필을 기반으로 받을 수 있는 정부지원 혜택을 관련도 순으로 정리했어요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
          </div>
        ) : benefits.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">📭</span>
            <p className="mt-4 text-lg font-bold text-gray-600">혜택 정보를 불러올 수 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.id}
                onClick={() => setExpandedId(expandedId === benefit.id ? null : benefit.id)}
                className="glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover-lift"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {subcategoryEmoji[benefit.subcategory || ''] || '🏛️'}
                        </span>
                        {benefit.subcategory && (
                          <span className="rounded-full bg-gradient-to-r from-violet-400 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {benefit.subcategory}
                          </span>
                        )}
                        {index < 3 && (
                          <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            추천
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-gray-800">{benefit.title}</h3>
                      {benefit.summary && !expandedId && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{benefit.summary}</p>
                      )}
                      {benefit.reasons.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {benefit.reasons.map((reason) => (
                            <span
                              key={reason}
                              className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 font-medium"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedId === benefit.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {benefit.body}
                      </div>
                      {benefit.tags && benefit.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {benefit.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
