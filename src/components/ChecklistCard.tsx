'use client';

import { useEffect, useState } from 'react';
import { getChecklistForAge, type ChecklistItem } from '@/lib/checklist';
import { getChildren } from '@/lib/children';
import { getAgeMonths } from '@/lib/peer-comparison';
import { CheckSquare, Square, ChevronDown, ChevronUp, ClipboardCheck } from 'lucide-react';

interface ChecklistCardProps {
  userId: string;
}

const STORAGE_KEY = 'bebecare_checklist_done';

function getDoneItems(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch { return new Set(); }
}

function saveDoneItems(items: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...items]));
}

export default function ChecklistCard({ userId }: ChecklistCardProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const children = await getChildren(userId);
      const bornChild = children.find(c => c.status === 'born' && c.birth_date);
      if (!bornChild?.birth_date) {
        setLoading(false);
        return;
      }
      const ageMonths = getAgeMonths(bornChild.birth_date);
      setItems(getChecklistForAge(ageMonths));
      setDone(getDoneItems());
      setLoading(false);
    }
    load();
  }, [userId]);

  const toggle = (id: string) => {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveDoneItems(next);
      return next;
    });
  };

  if (loading || items.length === 0) return null;

  const undone = items.filter(i => !done.has(i.id));
  const doneItems = items.filter(i => done.has(i.id));
  const progress = Math.round((doneItems.length / items.length) * 100);
  const displayItems = expanded ? items : undone.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-sage" />
          체크리스트
        </h3>
        <span className="text-xs text-gray-400">{doneItems.length}/{items.length} 완료 ({progress}%)</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {displayItems.map(item => {
          const isDone = done.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                isDone ? 'bg-green-50/50' : 'bg-white border border-gray-100'
              }`}
            >
              {isDone ? (
                <CheckSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{item.emoji}</span>
                  <span className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.title}
                  </span>
                  {item.priority === 'high' && !isDone && (
                    <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">중요</span>
                  )}
                </div>
                {!isDone && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.description}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-300 flex-shrink-0 mt-1">{item.ageRange}</span>
            </button>
          );
        })}
      </div>

      {items.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-2"
        >
          {expanded ? (
            <>접기 <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>더보기 ({items.length - 5}개) <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
}
