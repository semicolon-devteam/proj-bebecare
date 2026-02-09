'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VaccinationItem {
  name: string;
  label: string;
  code: string;
  recommendedMonths: number[];
}

const monthLabels = [
  '출생', '1개월', '2개월', '4개월', '6개월',
  '12개월', '15개월', '18개월', '24개월', '36개월', '48개월',
];

export default function VaccinationPage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<VaccinationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVaccine, setSelectedVaccine] = useState<{
    code: string;
    title: string;
    description: string;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/public-data/vaccination')
      .then((res) => res.json())
      .then((data) => {
        setSchedule(data.schedule || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadDetail = async (code: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/public-data/vaccination?vcnCd=${code}`);
      const data = await res.json();
      setSelectedVaccine(data);
    } catch {
      // ignore
    }
    setDetailLoading(false);
  };

  const formatMonths = (months: number[]) =>
    months
      .map((m) => (m === 0 ? '출생 시' : m < 12 ? `${m}개월` : `${Math.floor(m / 12)}세${m % 12 ? ` ${m % 12}개월` : ''}`))
      .join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
      <header className="bg-pink-500 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg px-2 py-1 text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            ← 뒤로
          </button>
          <h1 className="text-xl font-black text-white">💉 예방접종 스케줄</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-gray-600">
            🏥 질병관리청 공공데이터 기반 어린이 국가예방접종 일정입니다. 접종명을 탭하면 상세 정보를 볼 수 있어요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((vac) => (
              <div
                key={vac.code}
                onClick={() => loadDetail(vac.code)}
                className="glass rounded-2xl p-4 cursor-pointer hover-lift transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-800">
                      💉 {vac.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      접종 시기: {formatMonths(vac.recommendedMonths)}
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">상세 →</span>
                </div>

                {selectedVaccine?.code === vac.code && (
                  <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                    {detailLoading ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-blue-600" />
                        <span className="text-sm text-gray-500">로딩 중...</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                        {selectedVaccine.description || '상세 정보를 불러올 수 없습니다.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
