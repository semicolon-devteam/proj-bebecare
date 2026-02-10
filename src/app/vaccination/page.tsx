'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Syringe, Info } from 'lucide-react';

interface VaccinationItem {
  name: string;
  label: string;
  code: string;
  recommendedMonths: number[];
}

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
    <div className="min-h-screen bg-white">
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-dusty-rose" />
            <h1 className="text-lg font-bold text-gray-900">예방접종 스케줄</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        <div className="card rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-dusty-rose flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            질병관리청 공공데이터 기반 어린이 국가예방접종 일정입니다. 접종명을 탭하면 상세 정보를 볼 수 있어요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((vac) => (
              <div
                key={vac.code}
                onClick={() => loadDetail(vac.code)}
                className="card card-hover rounded-xl p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Syringe className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {vac.label}
                      </h3>
                    </div>
                    <p className="mt-1 ml-6 text-sm text-gray-500">
                      접종 시기: {formatMonths(vac.recommendedMonths)}
                    </p>
                  </div>
                  <span className="text-gray-300 text-xs">상세 →</span>
                </div>

                {selectedVaccine?.code === vac.code && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {detailLoading ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-dusty-rose" />
                        <span className="text-sm text-gray-400">로딩 중...</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
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
