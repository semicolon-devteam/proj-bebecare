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
          content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요. 😔',
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
        <div className="absolute top-0 -left-4 h-72 w-72 animate-float rounded-full bg-gradient-to-br from-pink-400 to-rose-400 opacity-30 blur-3xl" />
        <div className="glass relative flex flex-col items-center gap-6 rounded-3xl p-12 animate-scale-in">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-purple-200 border-t-blue-600" />
          <p className="text-xl font-bold text-purple-600 animate-pulse">
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-rose-100 via-purple-100 to-blue-200">
      {/* Background */}
      <div className="absolute top-0 -left-4 h-96 w-96 animate-float rounded-full bg-gradient-to-br from-pink-400 to-rose-400 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 -right-4 h-96 w-96 animate-float rounded-full bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 blur-3xl animation-delay-2000" />

      {user ? (
        <div className="relative z-10 flex h-screen flex-col">
          {/* Header */}
          <header className="bg-pink-500 px-4 py-4 shadow-lg animate-slide-down">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                BebeCare
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/vaccination')}
                  className="rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
                >
                  <span className="text-xl">💉</span>
                </button>
                <button
                  onClick={() => router.push('/benefits')}
                  className="rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
                >
                  <span className="text-xl">🏛️</span>
                </button>
                <button
                  onClick={() => router.push('/notifications')}
                  className="relative rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push('/mypage')}
                  className="rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300"
                >
                  <span className="text-xl">👤</span>
                </button>
              </div>
            </div>
          </header>

          {/* Push Subscription */}
          <div className="pt-2">
            <PushSubscription />
          </div>

          {/* Tab Bar */}
          <div className="glass border-b border-white/20 px-4">
            <div className="mx-auto max-w-4xl flex">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-3 text-center text-sm font-bold transition-all duration-200 border-b-2 ${
                  activeTab === 'timeline'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 맞춤 정보
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-center text-sm font-bold transition-all duration-200 border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 AI 상담
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeTab === 'timeline' ? (
            <div className="flex-1 overflow-hidden">
              <TimelineFeed userId={user.id} />
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-8">
                <div className="mx-auto max-w-3xl space-y-6">
                  {messages.length === 0 ? (
                    <div className="space-y-8 animate-fade-in">
                      <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-2 animate-scale-in">
                          <span className="text-5xl">🤖</span>
                          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r gradient-text from-blue-600 to-purple-600">
                            안녕하세요!
                          </h2>
                        </div>
                        <p className="text-xl text-gray-700">
                          임신·출산·육아에 대해 무엇이든 물어보세요
                        </p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          '지금 내 시기에 맞는 조언을 해줘',
                          '이번 주에 주의할 점이 있을까?',
                          '우리 지역 출산 혜택 알려줘',
                          '직장맘으로서 준비할 것들이 뭐야?',
                        ].map((example, index) => (
                          <button
                            key={index}
                            onClick={() => handleSendMessage(example)}
                            className="glass group rounded-2xl p-6 text-left hover-lift hover:border-purple-300 animate-scale-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl flex-shrink-0">💬</span>
                              <p className="text-base font-medium text-gray-800">
                                {example}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-4 animate-slide-up ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-xl">🤖</span>
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'glass text-gray-800'
                            }`}
                          >
                            <p className="text-base leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                              <span className="text-xl">👤</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-4 animate-slide-up">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xl">🤖</span>
                          </div>
                          <div className="glass rounded-2xl px-6 py-4">
                            <div className="flex gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce animation-delay-100" />
                              <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce animation-delay-500" />
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
              <div className="glass border-t border-white/20 px-4 py-4">
                <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
                  <div className="glass relative flex items-center gap-3 rounded-3xl p-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 bg-transparent px-4 py-3 text-gray-800 placeholder-gray-500 outline-none"
                      disabled={isTyping}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isTyping}
                      className="flex-shrink-0 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-bold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
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
        /* Landing Page — Mobile First */
        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 md:p-8">
          <div className="w-full max-w-lg md:max-w-2xl space-y-6 md:space-y-10 animate-fade-in">
            {/* Hero */}
            <div className="text-center space-y-4 animate-slide-down">
              <div className="glass rounded-3xl px-6 py-6 md:px-10 md:py-8 animate-glow">
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 md:gap-3">
                    <span className="text-3xl md:text-5xl animate-float">👶</span>
                    <h1 className="text-4xl md:text-7xl font-black text-purple-600">
                      BebeCare
                    </h1>
                    <span className="text-3xl md:text-5xl animate-float animation-delay-500">💕</span>
                  </div>
                  <p className="text-lg md:text-2xl font-bold text-gray-800">
                    임신·출산·육아 슈퍼앱
                  </p>
                  <p className="text-sm md:text-base text-gray-600 font-medium">
                    AI 기반 맞춤 정보 제공 서비스 ✨
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-5 animate-fade-in">
              <div className="glass rounded-2xl p-6 md:p-10 text-center animate-scale-in">
                <p className="text-lg md:text-2xl font-bold text-gray-800 leading-relaxed">
                  BebeCare와 함께
                  <br />
                  <span className="text-xl md:text-3xl font-black text-purple-600">
                    행복한 임신·출산·육아
                  </span>
                  <br />
                  를 시작하세요 💝
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                <button
                  onClick={() => router.push('/login')}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 md:px-10 md:py-6 font-black text-white shadow-xl hover-lift animate-scale-in"
                >
                  <span className="text-base md:text-xl">로그인</span>
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="glass rounded-2xl px-6 py-4 md:px-10 md:py-6 font-black hover-lift hover:border-purple-300 animate-scale-in animation-delay-100"
                >
                  <span className="text-base md:text-xl text-purple-600">
                    회원가입
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
