'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

export default function AdminNotificationsPage() {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState(false);

  // Send test push + in-app notification
  async function handleSendTest() {
    if (!userId || !title) return;
    setLoading(true);
    setResult(null);
    try {
      // 1. In-app notification (direct DB insert)
      const { error: inAppErr } = await supabase.from('notifications').insert({
        user_id: userId,
        title,
        body: body || title,
        category: 'test',
        status: 'sent',
      });

      // 2. Push notification via API
      const pushRes = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, body: body || title }),
      });
      const pushData = await pushRes.json();

      setResult(
        `✅ 인앱 알림: ${inAppErr ? `❌ ${inAppErr.message}` : '성공'}\n` +
        `✅ 푸시 알림: ${pushData.error ? `❌ ${pushData.error}` : `성공 (${pushData.sent || 0}건)`}`
      );
    } catch (e) {
      setResult(`❌ 에러: ${(e as Error).message}`);
    }
    setLoading(false);
  }

  // Trigger cron manually
  async function handleTriggerCron() {
    setCronLoading(true);
    setCronResult(null);
    try {
      const res = await fetch('/api/cron/notifications', {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test'}` },
      });
      const data = await res.json();
      setCronResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setCronResult(`❌ 에러: ${(e as Error).message}`);
    }
    setCronLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔔 알림 테스트 어드민</h1>

      {/* Manual Send */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-3">📤 수동 알림 발송</h2>
        <p className="text-xs text-gray-500 mb-3">Push + 인앱 알림을 동시에 보냅니다.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="9da88c2a-22a2-4606-810c-def6d503c5a4"
            />
            <p className="text-xs text-gray-400 mt-1">Reus 테스트: 9da88c2a-22a2-4606-810c-def6d503c5a4</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="테스트 알림입니다"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="알림 내용을 입력하세요"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSendTest}
            disabled={loading || !userId || !title}
            fullWidth
            variant="primary"
          >
            {loading ? '발송 중...' : '테스트 알림 발송 (Push + 인앱)'}
          </Button>
          {result && (
            <pre className="text-xs bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{result}</pre>
          )}
        </div>
      </Card>

      {/* Cron Trigger */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold mb-3">⏰ Cron 수동 실행</h2>
        <p className="text-xs text-gray-500 mb-3">
          타임라인 기반 알림 cron을 수동으로 실행합니다.<br />
          D-7, D-3, D-0 기준으로 알림을 생성합니다.
        </p>
        <Button
          onClick={handleTriggerCron}
          disabled={cronLoading}
          fullWidth
          variant="secondary"
        >
          {cronLoading ? '실행 중...' : 'Cron 실행'}
        </Button>
        {cronResult && (
          <pre className="mt-3 text-xs bg-gray-50 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto">{cronResult}</pre>
        )}
      </Card>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">📋 알림 시스템 구조</h3>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Push 알림:</strong> web-push (VAPID) → <code>push_subscriptions</code> 테이블</li>
          <li>• <strong>인앱 알림:</strong> <code>notifications</code> 테이블 → <code>/notifications</code> 페이지</li>
          <li>• <strong>Cron:</strong> 매일 01:00 UTC → D-7, D-3, D-0 자동 발송</li>
          <li>• <strong>중복 방지:</strong> <code>notification_log</code> 테이블로 같은 이벤트 재발송 차단</li>
          <li>• <strong>API:</strong> <code>POST /api/push/send</code> (userId, title, body)</li>
        </ul>
      </div>
    </div>
  );
}
