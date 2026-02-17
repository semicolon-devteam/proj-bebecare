'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Filter,
  Bookmark,
  BookmarkCheck,
  Star,
  ChevronDown,
  X,
  Loader2,
  Globe,
  Building2,
} from 'lucide-react';

interface Benefit {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  subcategory: string | null;
  tags: string[] | null;
  structured_data: Record<string, string> | null;
  region_filter: string | null;
  relevanceScore: number;
  reasons: string[];
}

interface BenefitsResponse {
  benefits: Benefit[];
  availableSubcategories: string[];
  profile_summary: {
    stage: string;
    is_working: boolean;
    region: string | null;
    children_count: number;
  };
}

type RegionFilter = 'my' | 'national' | 'selected';

const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

import { Coins as CoinsIcon, Hospital as HospitalIcon, BookOpen as BookOpenIcon, Baby as BabyIcon, Home as HomeIcon, ClipboardList as ClipboardIcon, Scale as ScaleIcon, Pin as PinIcon } from 'lucide-react';

const subcategoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '현금지원': CoinsIcon,
  '건강관리': HospitalIcon,
  '교육': BookOpenIcon,
  '돌봄': BabyIcon,
  '주거': HomeIcon,
  '세금·보험': ClipboardIcon,
  '일·가정양립': ScaleIcon,
};

export default function BenefitsTab({ userId }: { userId: string }) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [profileSummary, setProfileSummary] = useState<BenefitsResponse['profile_summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('my');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('전체');
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // Detail sheet
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

  // Bookmarks (local storage)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(`bebecare_bookmarks_${userId}`);
    if (saved) {
      try {
        setBookmarks(new Set(JSON.parse(saved)));
      } catch { /* ignore */ }
    }
  }, [userId]);

  const saveBookmarks = useCallback((newBookmarks: Set<string>) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(`bebecare_bookmarks_${userId}`, JSON.stringify([...newBookmarks]));
  }, [userId]);

  const toggleBookmark = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(bookmarks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveBookmarks(next);
  }, [bookmarks, saveBookmarks]);

  const fetchBenefits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      params.set('regionFilter', regionFilter);
      if (regionFilter === 'selected' && selectedRegion) {
        params.set('selectedRegion', selectedRegion);
      }
      if (activeSubcategory !== '전체') {
        params.set('subcategory', activeSubcategory);
      }

      const res = await fetch(`/api/benefits?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch');
      const data: BenefitsResponse = await res.json();
      setBenefits(data.benefits);
      setSubcategories(data.availableSubcategories);
      setProfileSummary(data.profile_summary);
    } catch (err) {
      console.error(err);
      setError('정보를 불러오지 못했어요');
    } finally {
      setLoading(false);
    }
  }, [regionFilter, selectedRegion, activeSubcategory]);

  useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  const regionLabel = regionFilter === 'my'
    ? `내 지역${profileSummary?.region ? ` (${profileSummary.region})` : ''}`
    : regionFilter === 'national'
    ? '전국'
    : selectedRegion || '지역 선택';

  return (
    <div className="flex flex-col h-full">
      {/* Region Filter Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-dusty-rose flex-shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => { setRegionFilter('my'); setShowRegionPicker(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                regionFilter === 'my'
                  ? 'bg-dusty-rose text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              내 지역
            </button>
            <button
              onClick={() => { setRegionFilter('national'); setShowRegionPicker(false); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                regionFilter === 'national'
                  ? 'bg-dusty-rose text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              전국
            </button>
            <button
              onClick={() => {
                if (regionFilter === 'selected') {
                  setShowRegionPicker(!showRegionPicker);
                } else {
                  setRegionFilter('selected');
                  setShowRegionPicker(true);
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                regionFilter === 'selected'
                  ? 'bg-dusty-rose text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {regionFilter === 'selected' && selectedRegion ? selectedRegion : '지역 선택'}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Region Picker Dropdown */}
        {showRegionPicker && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRegion(r);
                  setRegionFilter('selected');
                  setShowRegionPicker(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  selectedRegion === r
                    ? 'bg-dusty-rose text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Subcategory Chips */}
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-0.5">
          <button
            onClick={() => setActiveSubcategory('전체')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeSubcategory === '전체'
                ? 'bg-sage text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(sub)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeSubcategory === sub
                  ? 'bg-sage text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {(() => { const I = subcategoryIconMap[sub] || PinIcon; return <I className="h-3 w-3 inline-block" />; })()} {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-dusty-rose" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">{error}</p>
            <button onClick={fetchBenefits} className="mt-3 text-sm text-dusty-rose font-semibold">
              다시 시도
            </button>
          </div>
        ) : benefits.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">해당 조건의 혜택이 없어요</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">{benefits.length}개 혜택</p>
            {benefits.map((b) => (
              <BenefitCard
                key={b.id}
                benefit={b}
                isBookmarked={bookmarks.has(b.id)}
                onToggleBookmark={toggleBookmark}
                onClick={() => setSelectedBenefit(b)}
              />
            ))}
          </>
        )}
      </div>

      {/* Bottom Sheet Detail */}
      {selectedBenefit && (
        <BenefitDetailSheet
          benefit={selectedBenefit}
          isBookmarked={bookmarks.has(selectedBenefit.id)}
          onToggleBookmark={toggleBookmark}
          onClose={() => setSelectedBenefit(null)}
        />
      )}
    </div>
  );
}

function BenefitCard({
  benefit,
  isBookmarked,
  onToggleBookmark,
  onClick,
}: {
  benefit: Benefit;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e?: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const isRelevant = benefit.relevanceScore >= 10;

  return (
    <button
      onClick={onClick}
      className="w-full text-left card card-hover p-4 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {isRelevant && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-dusty-rose/10 text-dusty-rose text-[10px] font-semibold">
                <Star className="h-3 w-3" fill="currentColor" />
                나에게 해당
              </span>
            )}
            {benefit.subcategory && (
              <span className="text-[10px] text-gray-400 font-medium">
                {(() => { const I = subcategoryIconMap[benefit.subcategory] || PinIcon; return <I className="h-3 w-3 inline-block" />; })()} {benefit.subcategory}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {benefit.title}
          </h3>
          {benefit.summary && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {benefit.summary}
            </p>
          )}
          {benefit.tags && benefit.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {benefit.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => onToggleBookmark(benefit.id, e)}
          className="p-1.5 -m-1.5 flex-shrink-0"
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-5 w-5 text-dusty-rose" fill="currentColor" />
          ) : (
            <Bookmark className="h-5 w-5 text-gray-300" />
          )}
        </button>
      </div>
      {benefit.region_filter && benefit.region_filter !== '전국' && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-sage">
          <Globe className="h-3 w-3" />
          {benefit.region_filter}
        </div>
      )}
    </button>
  );
}

function BenefitDetailSheet({
  benefit,
  isBookmarked,
  onToggleBookmark,
  onClose,
}: {
  benefit: Benefit;
  isBookmarked: boolean;
  onToggleBookmark: (id: string, e?: React.MouseEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[85dvh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-3 border-b border-border">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              {benefit.subcategory && (
                <span className="text-xs text-sage font-medium">
                  {(() => { const I = subcategoryIconMap[benefit.subcategory] || PinIcon; return <I className="h-3 w-3 inline-block" />; })()} {benefit.subcategory}
                </span>
              )}
              {benefit.region_filter && (
                <span className="text-xs text-gray-400">{benefit.region_filter}</span>
              )}
            </div>
            <h2 className="text-base font-bold text-gray-900 leading-snug">
              {benefit.title}
            </h2>
            {benefit.reasons.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {benefit.reasons.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded-full bg-dusty-rose/10 text-dusty-rose text-[10px] font-medium">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => onToggleBookmark(benefit.id, e)}
              className="p-2 -m-1"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-dusty-rose" fill="currentColor" />
              ) : (
                <Bookmark className="h-5 w-5 text-gray-400" />
              )}
            </button>
            <button onClick={onClose} className="p-2 -m-1">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Structured Data Table */}
          {benefit.structured_data && Object.keys(benefit.structured_data).length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden">
              {Object.entries(benefit.structured_data).map(([key, value], i) => (
                <div
                  key={key}
                  className={`flex ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <div className="w-24 flex-shrink-0 bg-gray-50 px-3 py-2.5 text-xs font-medium text-gray-600">
                    {key}
                  </div>
                  <div className="flex-1 px-3 py-2.5 text-xs text-gray-800 leading-relaxed">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {benefit.summary && (
            <div className="bg-surface rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{benefit.summary}</p>
            </div>
          )}

          {/* Body */}
          {benefit.body && (
            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {benefit.body}
              </div>
            </div>
          )}

          {/* Tags */}
          {benefit.tags && benefit.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {benefit.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
