'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createConversation, saveMessage, generateConversationTitle } from '@/lib/chat';
import type { User } from '@supabase/supabase-js';
import { MessageCircle } from 'lucide-react';
import { CuteLoader, FadeInUp } from '@/components/animations/MotionWrappers';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

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
        <CuteLoader />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center">
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-dusty-rose" aria-hidden="true" />
            AI 상담
          </h1>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 bg-surface">
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
                  <FadeInUp key={index} delay={index * 0.05}>
                    <Card 
                      hover="lift" 
                      onClick={() => handleSendMessage(example)}
                      className="p-4 cursor-pointer"
                    >
                      <p className="text-sm text-gray-700">
                        {example}
                      </p>
                    </Card>
                  </FadeInUp>
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
                      <MessageCircle className="h-4 w-4 text-gray-500" aria-hidden="true" />
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
                    <MessageCircle className="h-4 w-4 text-gray-500" aria-hidden="true" />
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

      {/* Chat Input - above BottomTabBar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="메시지를 입력하세요..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              size="md"
            >
              전송
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}