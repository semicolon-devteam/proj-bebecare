'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { parseVoiceInput, voiceLogToRecord, type VoiceParseResult } from '@/lib/voice-parse';
import { IconByName } from '@/lib/icon-map';
import { addBabyLog, LOG_TYPE_CONFIG } from '@/lib/baby-logs';

interface VoiceInputProps {
  userId: string;
  childId: string | null;
  onLogSaved: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'confirming' | 'saving' | 'done' | 'error';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function getSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const recognition = new SR();
  recognition.lang = 'ko-KR';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  return recognition;
}

export default function VoiceInput({ userId, childId, onLogSaved }: VoiceInputProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSupported(!!SR);
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setInterimTranscript('');
    setParseResult(null);
    setErrorMsg('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) {
      setState('error');
      setErrorMsg('음성이 인식되지 않았어요');
      return;
    }

    setState('processing');

    try {
      const result = await parseVoiceInput(text);
      setParseResult(result);

      if (result.success && result.logs.length > 0) {
        setState('confirming');
      } else {
        setState('error');
        setErrorMsg(result.error || '인식할 수 없는 내용이에요');
      }
    } catch {
      setState('error');
      setErrorMsg('처리 중 오류가 발생했어요');
    }
  }, []);

  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setSupported(false);
      return;
    }

    recognitionRef.current = recognition;
    setTranscript('');
    setInterimTranscript('');
    setParseResult(null);
    setErrorMsg('');

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + final);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setState('error');
        setErrorMsg('음성이 감지되지 않았어요. 다시 시도해주세요.');
      } else if (event.error === 'not-allowed') {
        setState('error');
        setErrorMsg('마이크 권한이 필요해요. 설정에서 허용해주세요.');
      } else {
        setState('error');
        setErrorMsg('음성 인식 오류가 발생했어요');
      }
    };

    recognition.onend = () => {
      // Process whatever we have
      setTranscript(prev => {
        const fullText = prev;
        if (fullText) {
          // Small delay to ensure state is updated
          setTimeout(() => processTranscript(fullText), 100);
        } else {
          setState('error');
          setErrorMsg('음성이 인식되지 않았어요');
        }
        return prev;
      });
    };

    recognition.start();

    // Auto-stop after 10 seconds
    timeoutRef.current = setTimeout(() => {
      recognition.stop();
    }, 10000);
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    recognitionRef.current?.stop();
  }, []);

  const confirmAndSave = useCallback(async () => {
    if (!parseResult || !parseResult.logs.length) return;

    setState('saving');

    try {
      for (const log of parseResult.logs) {
        const record = voiceLogToRecord(log, userId, childId);
        await addBabyLog(record);
      }
      setState('done');
      onLogSaved();

      // Auto-reset after 2 seconds
      setTimeout(reset, 2000);
    } catch {
      setState('error');
      setErrorMsg('저장 중 오류가 발생했어요');
    }
  }, [parseResult, userId, childId, onLogSaved, reset]);

  if (!supported) {
    return null; // Don't render if not supported
  }

  return (
    <>
      {/* Main mic FAB button - only shown in idle state */}
      {state === 'idle' && (
        <button
          onClick={startListening}
          className="fixed bottom-24 left-6 h-14 w-14 rounded-full bg-sage text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-20"
          aria-label="음성으로 기록"
        >
          <Mic className="h-6 w-6" aria-hidden="true" />
        </button>
      )}

      {/* Voice input overlay */}
      {state !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => { if (state === 'error' || state === 'done') reset(); }}>
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <button onClick={() => { if (recognitionRef.current) recognitionRef.current.abort(); reset(); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </button>
            </div>

            {/* Listening state */}
            {state === 'listening' && (
              <div className="text-center py-6">
                <button
                  onClick={stopListening}
                  className="mx-auto h-20 w-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse mb-4"
                >
                  <MicOff className="h-8 w-8" aria-hidden="true" />
                </button>
                <p className="text-lg font-bold text-gray-900 mb-2">듣고 있어요...</p>
                <p className="text-sm text-gray-500 min-h-[2.5rem]">
                  {transcript || interimTranscript || '말씀해주세요'}
                </p>
                {(transcript || interimTranscript) && (
                  <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
                    <p className="text-sm text-gray-700">
                      {transcript}
                      <span className="text-gray-400">{interimTranscript}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Processing state */}
            {state === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 text-dusty-rose animate-spin mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg font-bold text-gray-900 mb-1">분석 중...</p>
                <p className="text-sm text-gray-500">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}

            {/* Confirming state */}
            {state === 'confirming' && parseResult && (
              <div className="py-4">
                <p className="text-lg font-bold text-gray-900 mb-4 text-center">
                  {parseResult.confirmation}
                </p>

                {/* Show parsed logs preview */}
                <div className="space-y-2 mb-5">
                  {parseResult.logs.map((log, i) => {
                    const config = LOG_TYPE_CONFIG[log.log_type];
                    return (
                      <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${config.bgColor}`}>
                        <IconByName name={config.icon} className={`h-5 w-5 ${config.color}`} />
                        <div>
                          <span className={`text-sm font-bold ${config.color}`}>{config.label}</span>
                          {log.amount_ml && <span className="text-sm text-gray-500 ml-2">{log.amount_ml}ml</span>}
                          {log.diaper_type && (
                            <span className="text-sm text-gray-500 ml-2">
                              {log.diaper_type === 'wet' ? '소변' : log.diaper_type === 'dirty' ? '대변' : '혼합'}
                            </span>
                          )}
                          {log.duration_minutes && (
                            <span className="text-sm text-gray-500 ml-2">
                              {log.duration_minutes >= 60 ? `${Math.floor(log.duration_minutes / 60)}시간 ${log.duration_minutes % 60}분` : `${log.duration_minutes}분`}
                            </span>
                          )}
                          {log.memo && <span className="text-sm text-gray-400 ml-2">{log.memo}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmAndSave}
                    className="flex-1 rounded-xl bg-dusty-rose py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    저장
                  </button>
                </div>
              </div>
            )}

            {/* Saving state */}
            {state === 'saving' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 text-dusty-rose animate-spin mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg font-bold text-gray-900">저장 중...</p>
              </div>
            )}

            {/* Done state */}
            {state === 'done' && (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
                <p className="text-lg font-bold text-gray-900">저장 완료!</p>
              </div>
            )}

            {/* Error state */}
            {state === 'error' && (
              <div className="text-center py-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-400" aria-hidden="true" />
                </div>
                <p className="text-sm text-gray-500 mb-4">{errorMsg}</p>
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-500"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => { reset(); setTimeout(startListening, 100); }}
                    className="flex-1 rounded-xl bg-sage py-3 text-sm font-semibold text-white"
                  >
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
