'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isOnboardingCompleted } from '@/lib/profile';
import {
  createConversation,
  saveMessage,
  generateConversationTitle,
} from '@/lib/chat';
import type { User } from '@supabase/supabase-js';
import PushSubscription from '@/components/PushSubscription';
import TimelineFeed from '@/components/TimelineFeed';
import { supabase } from '@/lib/supabase';
import { addBabyLog, LOG_TYPE_CONFIG, type LogType, type DiaperType } from '@/lib/baby-logs';
import { getChildren } from '@/lib/children';
import { useTimer } from '@/components/Timer';
import { Bell, User as UserIcon, Syringe, Building2, MessageCircle, LayoutList, Baby, ClipboardList, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Tab = 'timeline' | 'chat';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFab, setShowFab] = useState(false);
  const [quickLogType, setQuickLogType] = useState<LogType | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const { startTimer } = useTimer();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null)
        .then(({ count }) => setUnreadCount(count || 0));
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const completed = await isOnboardingCompleted(currentUser.id);
        if (!completed) {
          router.push('/onboarding');
          return;
        }
      }
      setUser(currentUser);
      if (currentUser) {
        const kids = await getChildren(currentUser.id);
        if (kids.length > 0) setSelectedChildId(kids[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user) return;

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const newConversation = await createConversation(
        user.id,
        generateConversationTitle(content)
      );
      if (!newConversation) return;
      currentConversationId = newConversation.id;
      setConversationId(currentConversationId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    await saveMessage(currentConversationId, 'user', userMessage.content);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('AI 응답 실패');

      const aiMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: aiMessageId, role: 'assistant', content: '', timestamp: new Date() },
      ]);
      setIsTyping(false);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  accumulatedContent += data.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId ? { ...msg, content: accumulatedContent } : msg
                    )
                  );
                }
              } catch {
                // skip
              }
            }
          }
        }
        if (accumulatedContent && currentConversationId) {
          await saveMessage(currentConversationId, 'assistant', accumulatedContent);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-dusty-rose" />
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {user ? (
        <div className="flex h-[100dvh] flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <h1 className="text-xl font-semibold text-dusty-rose tracking-tight">
                BebeCare
              </h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push('/baby-log')}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                  title="육아 기록"
                >
                  <ClipboardList className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push('/pregnancy-weeks')}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Baby className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push('/vaccination')}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Syringe className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push('/benefits')}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => router.push('/notifications')}
                  className="relative rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/mypage')}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Push Subscription */}
          <div className="pt-2">
            <PushSubscription />
          </div>

          {/* Tab Bar */}
          <div className="sticky top-[53px] z-20 border-b border-border bg-white/95 backdrop-blur-sm px-4">
            <div className="mx-auto max-w-4xl flex">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 flex-1 py-3 justify-center text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'timeline'
                    ? 'border-dusty-rose text-dusty-rose'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutList className="h-4 w-4" />
                맞춤 정보
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 flex-1 py-3 justify-center text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-dusty-rose text-dusty-rose'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                AI 상담
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'timeline' ? (
            <div className="flex-1 overflow-hidden relative">
              <TimelineFeed userId={user.id} />

              {/* FAB */}
              <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
                {showFab && (
                  <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2">
                    {([['formula', '🍼', '분유'], ['sleep', '😴', '수면'], ['diaper', '🧷', '기저귀']] as [LogType, string, string][]).map(([type, emoji, label]) => (
                      <button
                        key={type}
                        onClick={() => { setQuickLogType(type); setShowFab(false); }}
                        className="flex items-center gap-2 rounded-full bg-white shadow-lg border border-gray-100 pl-4 pr-5 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-lg">{emoji}</span>
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowFab(!showFab)}
                  className={`h-14 w-14 rounded-full bg-dusty-rose text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-all ${showFab ? 'rotate-45' : ''}`}
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>

              {/* Quick Log Modal */}
              {quickLogType && (
                <QuickLogModal
                  userId={user.id}
                  childId={selectedChildId}
                  logType={quickLogType}
                  onClose={() => setQuickLogType(null)}
                  onStartTimer={(type) => { startTimer(type, user.id, selectedChildId); setQuickLogType(null); }}
                />
              )}
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 bg-surface">
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.length === 0 ? (
                    <div className="space-y-6">
                      <div className="text-center space-y-2 pt-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                          안녕하세요!
                        </h2>
                        <p className="text-gray-500">
                          임신·출산·육아에 대해 무엇이든 물어보세요
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {[
                          '지금 내 시기에 맞는 조언을 해줘',
                          '이번 주에 주의할 점이 있을까?',
                          '우리 지역 출산 혜택 알려줘',
                          '직장맘으로서 준비할 것들이 뭐야?',
                        ].map((example, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(example)}
                            className="card card-hover p-4 text-left"
                          >
                            <p className="text-sm text-gray-700">
                              {example}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-dusty-rose text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <div className="text-sm leading-relaxed prose prose-sm prose-gray max-w-none [&>h1]:text-base [&>h1]:font-bold [&>h1]:mt-3 [&>h1]:mb-1 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:mt-2.5 [&>h2]:mb-1 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mt-2 [&>h3]:mb-0.5 [&>p]:my-1 [&>ul]:my-1 [&>ul]:pl-4 [&>ol]:my-1 [&>ol]:pl-4 [&>li]:my-0.5">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="bg-gray-100 rounded-2xl px-4 py-3">
                            <div className="flex gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:100ms]" />
                              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:200ms]" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="sticky bottom-0 z-20 border-t border-border bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
                <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none"
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isTyping}
                      className="flex-shrink-0 rounded-lg bg-dusty-rose px-4 py-2 text-sm font-semibold text-white hover:bg-dusty-rose-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      전송
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Landing Page */
        <div className="flex min-h-screen items-center justify-center px-5 py-8">
          <div className="w-full max-w-lg space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="card rounded-2xl px-6 py-8">
                <h1 className="text-4xl md:text-5xl font-bold text-dusty-rose">
                  BebeCare
                </h1>
                <p className="mt-2 text-lg font-semibold text-gray-800">
                  임신·출산·육아 슈퍼앱
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  AI 기반 맞춤 정보 제공 서비스
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <div className="card rounded-2xl p-6 text-center">
                <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                  BebeCare와 함께
                  <br />
                  <span className="text-xl font-bold text-dusty-rose">
                    행복한 임신·출산·육아
                  </span>
                  <br />
                  를 시작하세요
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="rounded-xl bg-dusty-rose px-6 py-4 font-semibold text-white shadow-sm hover:bg-dusty-rose-dark transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="card rounded-xl px-6 py-4 font-semibold text-dusty-rose card-hover"
                >
                  회원가입
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Quick Log Modal for home page FAB */
function QuickLogModal({
  userId,
  childId,
  logType,
  onClose,
  onStartTimer,
}: {
  userId: string;
  childId: string | null;
  logType: LogType;
  onClose: () => void;
  onStartTimer: (type: LogType) => void;
}) {
  const [amountMl, setAmountMl] = useState('');
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'manual' | 'timer'>('manual');

  const needsAmount = logType === 'formula';
  const needsDuration = logType === 'sleep';
  const needsDiaperType = logType === 'diaper';
  const canTimer = ['sleep', 'breast'].includes(logType);
  const config = LOG_TYPE_CONFIG[logType];

  const handleSave = async () => {
    setSaving(true);
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const started_at = `${dateStr}T${startTime}:00+09:00`;
    const ended_at = endTime ? `${dateStr}T${endTime}:00+09:00` : null;

    await addBabyLog({
      user_id: userId,
      child_id: childId,
      log_type: logType,
      started_at,
      ended_at,
      amount_ml: needsAmount && amountMl ? parseInt(amountMl) : null,
      diaper_type: needsDiaperType ? diaperType : null,
      memo: memo || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <h2 className="text-lg font-bold text-gray-900">{config.label} 기록</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Timer vs Manual toggle for sleep */}
        {canTimer && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 transition-all ${mode === 'manual' ? 'bg-dusty-rose/10 border-dusty-rose text-dusty-rose' : 'bg-gray-50 border-transparent text-gray-400'}`}
            >
              수동 입력
            </button>
            <button
              onClick={() => setMode('timer')}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 transition-all ${mode === 'timer' ? 'bg-dusty-rose/10 border-dusty-rose text-dusty-rose' : 'bg-gray-50 border-transparent text-gray-400'}`}
            >
              ⏱ 타이머
            </button>
          </div>
        )}

        {mode === 'timer' && canTimer ? (
          <button
            onClick={() => onStartTimer(logType)}
            className="w-full rounded-xl bg-dusty-rose text-white py-3 font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            ⏱ 타이머 시작
          </button>
        ) : (
          <>
            {/* Time */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">시작 시간</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
              {needsDuration && (
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">종료 시간</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
                </div>
              )}
            </div>

            {needsAmount && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">용량 (ml)</label>
                <input type="number" placeholder="예: 120" value={amountMl} onChange={e => setAmountMl(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
              </div>
            )}

            {needsDiaperType && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">종류</label>
                <div className="flex gap-2">
                  {([['wet', '💧 소변'], ['dirty', '💩 대변'], ['mixed', '🔄 혼합']] as [DiaperType, string][]).map(([type, label]) => (
                    <button key={type} onClick={() => setDiaperType(type)} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all ${diaperType === type ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">메모</label>
              <input type="text" placeholder="선택사항" value={memo} onChange={e => setMemo(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            </div>

            <button onClick={handleSave} disabled={saving} className="w-full rounded-xl bg-dusty-rose text-white py-3 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
