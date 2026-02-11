'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Building2, CreditCard, Banknote, FileText, Target, MapPin, Globe, Map } from 'lucide-react';

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

interface ProfileSummary {
  stage: string;
  is_working: boolean;
  region: string | null;
  children_count: number;
}

interface BenefitsResponse {
  benefits: Benefit[];
  availableSubcategories: string[];
  profile_summary: ProfileSummary;
}

const subcategoryIcon: Record<string, typeof Building2> = {
  건강관리: Building2,
  바우처: CreditCard,
  현금지원: Banknote,
  세금: FileText,
  주거: Building2,
  의료비: Building2,
  산후조리: Building2,
  다자녀: Building2,
  급여: Banknote,
  출산장려금: Banknote,
};

// 한국 시/도 목록
const KOREA_PROVINCES = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
];

export default function BenefitsPage() {
  const router = useRouter();
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // 필터링 상태
  const [regionMode, setRegionMode] = useState<RegionMode>('my');
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [userRegion, setUserRegion] = useState<string | null>(null);

  // Benefits 로드 함수
  const loadBenefits = useCallback(async (mode: RegionMode = regionMode, province?: string, subcategory?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        router.push('/login'); 
        return; 
      }

      const params = new URLSearchParams();
      
      if (mode === 'national') {
        params.set('regionFilter', 'national');
      } else if (mode === 'my') {
        params.set('regionFilter', 'my');
      } else if (mode === 'select' && province) {
        params.set('regionFilter', 'selected');
        params.set('selectedRegion', province);
      }

      if (subcategory && subcategory !== '전체') {
        params.set('subcategory', subcategory);
      }

      const res = await fetch(`/api/benefits?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data: BenefitsResponse = await res.json();
        setBenefits(data.benefits || []);
        setAvailableSubcategories(data.availableSubcategories || []);
        if (!userRegion && data.profile_summary?.region) {
          setUserRegion(data.profile_summary.region);
        }
      }
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  }, [regionMode, userRegion, router]);

  // 초기 로드
  useEffect(() => {
    loadBenefits();
  }, [loadBenefits]);

  // 지역 모드 변경 핸들러
  const handleRegionModeChange = (mode: RegionMode) => {
    setRegionMode(mode);
    setSelectedProvince(null);
    if (mode !== 'select') {
      loadBenefits(mode, undefined, selectedSubcategory || undefined);
    }
  };

  // 지역 선택 핸들러
  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    loadBenefits('select', province, selectedSubcategory || undefined);
  };

  // 서브카테고리 선택 핸들러
  const handleSubcategorySelect = (subcategory: string | null) => {
    setSelectedSubcategory(subcategory);
    const currentProvince = regionMode === 'select' ? selectedProvince : undefined;
    loadBenefits(regionMode, currentProvince || undefined, subcategory || undefined);
  };

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
              {KOREA_PROVINCES.map((province) => (
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
              onClick={() => handleSubcategorySelect(null)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all ${
                !selectedSubcategory
                  ? 'bg-dusty-rose text-white border-dusty-rose'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-dusty-rose/50'
              }`}
            >
              전체
            </button>
            {availableSubcategories.map((sub) => {
              const Icon = subcategoryIcon[sub] || Building2;
              return (
                <button
                  key={sub}
                  onClick={() => handleSubcategorySelect(selectedSubcategory === sub ? null : sub)}
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
        ) : benefits.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-600">혜택 정보를 불러올 수 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {benefits.map((benefit, index) => {
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