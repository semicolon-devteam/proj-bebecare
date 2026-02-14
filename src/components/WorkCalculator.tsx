'use client';

import { useMemo, useState } from 'react';
import { Calculator, Calendar, Baby, Briefcase, Clock, Heart, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  dueDate?: string | null;
  childBirthDate?: string | null;
}

interface Period {
  label: string;
  icon: React.ReactNode;
  start: Date;
  end: Date;
  color: string;
  note?: string;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function addMonths(d: Date, months: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

function addYears(d: Date, years: number): Date {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + years);
  return r;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (86400000));
}

export default function WorkCalculator({ dueDate, childBirthDate }: Props) {
  const periods = useMemo(() => {
    const baseDate = dueDate ? new Date(dueDate) : childBirthDate ? new Date(childBirthDate) : null;
    if (!baseDate) return [];

    const pregnancyStart = new Date(baseDate.getTime() - 280 * 86400000);
    const results: Period[] = [];

    // 임신 12주 이내 근로시간 단축
    const week12End = addDays(pregnancyStart, 12 * 7);
    results.push({
      label: '임신초기 근로단축',
      icon: <Clock className="h-3.5 w-3.5" />,
      start: pregnancyStart,
      end: week12End,
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      note: '임신 12주 이내, 일 2시간 단축',
    });

    // 임신 36주 이후 근로시간 단축
    const week36Start = addDays(pregnancyStart, 36 * 7);
    results.push({
      label: '임신후기 근로단축',
      icon: <Clock className="h-3.5 w-3.5" />,
      start: week36Start,
      end: baseDate,
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      note: '임신 36주 이후, 일 2시간 단축',
    });

    // 출산전후휴가 (출산일 전후 90일, 출산 후 45일 이상 확보)
    const materLeaveStart = addDays(baseDate, -45);
    const materLeaveEnd = addDays(baseDate, 44);
    results.push({
      label: '출산전후휴가',
      icon: <Heart className="h-3.5 w-3.5" />,
      start: materLeaveStart,
      end: materLeaveEnd,
      color: 'bg-pink-100 text-pink-700 border-pink-200',
      note: '90일 (출산 후 45일 이상 보장)',
    });

    // 배우자 출산휴가 (출산일로부터 10일)
    results.push({
      label: '배우자 출산휴가',
      icon: <Briefcase className="h-3.5 w-3.5" />,
      start: baseDate,
      end: addDays(baseDate, 9),
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      note: '10일 (유급)',
    });

    // 육아휴직 (출산휴가 종료 후 ~ 최대 1년)
    const parentLeaveStart = addDays(materLeaveEnd, 1);
    const parentLeaveEnd = addYears(parentLeaveStart, 1);
    results.push({
      label: '육아휴직',
      icon: <Baby className="h-3.5 w-3.5" />,
      start: parentLeaveStart,
      end: parentLeaveEnd,
      color: 'bg-teal-100 text-teal-700 border-teal-200',
      note: '최대 1년 (자녀 만 8세까지 가능)',
    });

    // 육아기 근로시간 단축 (육아휴직 대신 또는 이후, 최대 2년)
    results.push({
      label: '육아기 근로단축',
      icon: <Clock className="h-3.5 w-3.5" />,
      start: parentLeaveStart,
      end: addYears(parentLeaveStart, 2),
      color: 'bg-violet-100 text-violet-700 border-violet-200',
      note: '최대 2년 (육아휴직 미사용분 전환 가능)',
    });

    return results;
  }, [dueDate, childBirthDate]);

  const [collapsed, setCollapsed] = useState(false);

  if (periods.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mx-4 mb-3 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-teal-600" />
          <h3 className="text-sm font-bold text-teal-800">출산 기간 자동 계산</h3>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-teal-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-teal-400" />
        )}
      </button>
      {!collapsed && <div className="space-y-2 mt-3">
        {periods.map((p, i) => {
          const isActive = today >= p.start && today <= p.end;
          const isPast = today > p.end;
          const daysLeft = diffDays(today, p.end);

          return (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 ${
                isActive ? p.color + ' ring-1 ring-offset-1' : isPast ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0">{p.icon}</span>
                  <span className={`text-xs font-semibold ${isPast ? 'text-gray-400' : ''}`}>
                    {p.label}
                  </span>
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/60">
                    {daysLeft > 0 ? `${daysLeft}일 남음` : '진행중'}
                  </span>
                )}
              </div>
              <div className={`text-[11px] mt-1 ${isPast ? 'text-gray-300' : 'text-gray-500'}`}>
                <Calendar className="h-3 w-3 inline mr-1" />
                {formatDate(p.start)} ~ {formatDate(p.end)}
              </div>
              {p.note && (
                <p className={`text-[10px] mt-0.5 ${isPast ? 'text-gray-300' : 'text-gray-400'}`}>
                  {p.note}
                </p>
              )}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
