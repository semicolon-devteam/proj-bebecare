'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Building2, CreditCard, Banknote, FileText, Target, MapPin, Globe, Map } from 'lucide-react';
import { REGION_DATA } from '@/lib/regions';

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

type RegionMode = 'my' | 'national' | 'select';

const subcategoryIcon: Record<string, typeof Building2> = {
  건강관리: Building2,
  바우처: CreditCard,
  현금지원: Banknote,
  세금: FileText,
};

const SUBCATEGORIES = ['건강관리', '바우처', '현금지원', '세금'] as const;
const PROVINCES = Object.keys(REGION_DATA);

export default function BenefitsPage() {
  const router = useRouter();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [regionMode, setRegionMode] = useState<RegionMode>('my');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [profileSummary, setProfileSummary] = useState<ProfileSummary | null>(null);

  const fetchBenefits = useCallback(async (regionParam?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const params = regionParam ? `?region=${encodeURIComponent(regionParam)}` : '';
      const response = await fetch(`/api/benefits${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBenefits(data.benefits || []);
        if (data.profile_summary?.region && !userRegion) {
          setUserRegion(data.profile_summary.region);
        }
        return data.profile_summary?.region as string | null;
      }
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }, [router, userRegion]);

  // Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }

        // Load benefits with new API structure
        const params = new URLSearchParams({ regionFilter: 'my' });
        const res = await fetch(`/api/benefits?${params}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        
        if (res.ok) {
          const data: BenefitsResponse = await res.json();
          setBenefits(data.benefits || []);
          setAvailableSubcategories(data.availableSubcategories || []);
          setProfileSummary(data.profile_summary);
          setUserRegion(data.profile_summary?.region || null);
        }
      } catch (error) {
        console.error('Error loading benefits:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleRegionModeChange = (mode: RegionMode) => {
    setRegionMode(mode);
    setSelectedProvince(null);
    if (mode === 'my') {
      if (userRegion) fetchBenefits(userRegion);
      else fetchBenefits();
    } else if (mode === 'national') {
      fetchBenefits('__national__');
    }
    // 'select' mode: wait for province selection
  };

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    fetchBenefits(province);
  };

  const filteredBenefits = selectedSubcategory
    ? benefits.filter(b => b.subcategory === selectedSubcategory)
    : benefits;

  const segmentedItems: { key: RegionMode; label: string; icon: typeof MapPin }[] = [
    { key: 'my', label: '내 지역', icon: MapPin },
    { key: 'national', label: '전국', icon: Globe },
    { key: 'select', label: '지역선택', icon: Map },
  ];

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Header */}
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-dusty-rose" />
            <h1 className="text-lg font-bold text-gray-900">정부지원 혜택</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4 space-y-3">
        {/* Segmented Control */}
        <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
          {segmentedItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleRegionModeChange(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-all ${
                regionMode === key
                  ? 'bg-white text-dusty-rose shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Region info */}
        {regionMode === 'my' && userRegion && (
          <div className="flex items-center gap-1.5 px-1">
            <MapPin className="h-3.5 w-3.5 text-dusty-rose" />
            <span className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{userRegion}</span> 기준 혜택을 보여드려요
            </span>
          </div>
        )}

        {/* Province chips for "지역선택" mode */}
        {regionMode === 'select' && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              {PROVINCES.map((province) => (
                <button
                  key={province}
                  onClick={() => handleProvinceSelect(province)}
                  className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all ${
                    selectedProvince === province
                      ? 'bg-dusty-rose text-white border-dusty-rose'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-dusty-rose/50'
                  }`}
                >
                  {province}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subcategory filter chips */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setSelectedSubcategory(null)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all ${
                !selectedSubcategory
                  ? 'bg-dusty-rose text-white border-dusty-rose'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-dusty-rose/50'
              }`}
            >
              전체
            </button>
            {SUBCATEGORIES.map((sub) => {
              const Icon = subcategoryIcon[sub] || Building2;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                  className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all ${
                    selectedSubcategory === sub
                      ? 'bg-dusty-rose text-white border-dusty-rose'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-dusty-rose/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Banner */}
        <div className="card rounded-xl p-4 flex items-start gap-3">
          <Target className="h-5 w-5 text-dusty-rose flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            회원님의 프로필을 기반으로 받을 수 있는 정부지원 혜택을 관련도 순으로 정리했어요.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
          </div>
        ) : filteredBenefits.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-600">
              {regionMode === 'select' && !selectedProvince
                ? '지역을 선택해주세요'
                : '해당 조건의 혜택이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBenefits.map((benefit, index) => {
              const IconComp = subcategoryIcon[benefit.subcategory || ''] || Building2;
              return (
                <div
                  key={benefit.id}
                  onClick={() => setExpandedId(expandedId === benefit.id ? null : benefit.id)}
                  className="card card-hover rounded-xl overflow-hidden cursor-pointer"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <IconComp className="h-4 w-4 text-gray-400" />
                          {benefit.subcategory && (
                            <span className="rounded-md bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[10px] font-semibold text-violet-600">
                              {benefit.subcategory}
                            </span>
                          )}
                          {index < 3 && (
                            <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                              추천
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">{benefit.title}</h3>
                        {benefit.summary && expandedId !== benefit.id && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{benefit.summary}</p>
                        )}
                        {benefit.reasons.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {benefit.reasons.map((reason) => (
                              <span
                                key={reason}
                                className="rounded-md bg-blue-50 border border-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 font-medium"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedId === benefit.id && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {benefit.body}
                        </div>
                        {benefit.tags && benefit.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {benefit.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-500"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
