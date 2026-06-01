import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  BACKEND_OFFLINE_MSG,
  mapPositionToJobType,
  realInterviewChat,
  realInterviewSummary,
} from '../services/backendApi';
import AnswerInput from './AnswerInput';
import InterviewRightPanel from './InterviewRightPanel';
import { BackHomeButton } from './HomeHub';

const MAX_USER_ROUNDS = 7;
const INTRO_MESSAGE = '你好，我是今天的面试官，请先做个自我介绍。';

const RealInterview = ({ position, positionName, onBack, nickname }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: INTRO_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('chat');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const [interviewStartTime] = useState(Date.now());
  const [detectionData, setDetectionData] = useState(null);
  const [expressionScore, setExpressionScore] = useState(70);
  const [eyeContactScore, setEyeContactScore] = useState(70);
  const [postureScore, setPostureScore] = useState(70);
  const [lowHeadCount, setLowHeadCount] = useState(0);
  const [faceSummary, setFaceSummary] = useState({});
  const userRoundCount = messages.filter((m) => m.role === 'user').length;

  const handleTranscript = useCallback((text) => setInput(text), []);
  const { isSupported: isMicSupported, isListening, toggleListening } =
    useSpeechRecognition({ onTranscript: handleTranscript });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, phase]);

  const finishWithSummary = async (allMessages) => {
    setLoading(true);
    setPhase('summary');
    try {
      const result = await realInterviewSummary({
        job_type: mapPositionToJobType(position),
        messages: allMessages,
      });
      setSummary(result);
    } catch (e) {
      setError(e.message === BACKEND_OFFLINE_MSG ? BACKEND_OFFLINE_MSG : e.message || '生成评价失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || phase !== 'chat') return;
    if (text.length < 5) {
      setError('回答请至少 5 个字');
      return;
    }
    setError('');
    setInput('');

    const userMsg = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    const nextUserCount = userRoundCount + 1;

    try {
      if (nextUserCount >= MAX_USER_ROUNDS) {
        await finishWithSummary(nextMessages);
        return;
      }

      const { reply } = await realInterviewChat({
        job_type: mapPositionToJobType(position),
        messages: nextMessages,
      });

      const withReply = [...nextMessages, { role: 'assistant', content: reply }];
      setMessages(withReply);

      if (nextUserCount >= MAX_USER_ROUNDS - 1) {
        await finishWithSummary(withReply);
      }
    } catch (e) {
      setError(e.message === BACKEND_OFFLINE_MSG ? BACKEND_OFFLINE_MSG : e.message || '发送失败，请重试');
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'summary') {
    return (
      <div>
        <BackHomeButton onClick={onBack} />
        <div className={`rounded-xl border p-6 ${theme.cardBg}`}>
          <h2 className={`text-xl font-bold mb-4 ${theme.accent}`}>整场面试综合评价</h2>
          {loading && (
            <div className="flex items-center justify-center py-12 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              正在生成评价...
            </div>
          )}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {summary && !loading && (
            <div className="space-y-4 text-sm">
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-bold ${theme.accent}`}>{summary.overall_score}</span>
                <span className={theme.muted}>分 · {summary.rank}</span>
              </div>
              <p className={theme.pageText}>{summary.summary}</p>
              {summary.strengths?.length > 0 && (
                <div>
                  <h4 className="font-medium text-emerald-600 mb-1">优势</h4>
                  <ul className={`list-disc pl-5 ${theme.muted}`}>
                    {summary.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.weaknesses?.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-500 mb-1">不足</h4>
                  <ul className={`list-disc pl-5 ${theme.muted}`}>
                    {summary.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.highlight_moment && (
                <p className="text-emerald-700 dark:text-emerald-400">
                  <strong>最佳表现：</strong>
                  {summary.highlight_moment}
                </p>
              )}
              {summary.weak_moment && (
                <p className="text-red-600 dark:text-red-400">
                  <strong>待加强：</strong>
                  {summary.weak_moment}
                </p>
              )}
              <p className={theme.muted}>录用倾向：{summary.hiring_tendency}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onBack}
            className={`mt-6 w-full py-3 rounded-lg font-medium ${theme.accentBg}`}
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      <section className="lg:col-span-8 flex flex-col min-h-[500px]">
        <BackHomeButton onClick={onBack} />
        <div className={`flex-1 rounded-xl border flex flex-col overflow-hidden ${theme.cardBg}`}>
          <div className={`px-4 py-3 border-b ${theme.accentBorder} flex justify-between items-center`}>
            <div>
              <span className={`font-semibold ${theme.pageText}`}>真实面试</span>
              <span className={`ml-2 text-xs ${theme.muted}`}>
                {positionName} · 第 {userRoundCount}/{MAX_USER_ROUNDS} 轮
              </span>
            </div>
            <span className={`text-xs ${theme.muted}`}>{nickname}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'assistant' ? theme.bubbleAi : theme.bubbleUser
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm ${theme.bubbleAi}`}>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  面试官思考中...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className={`p-4 border-t ${theme.accentBorder}`}>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <AnswerInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  isListening={isListening}
                  isMicSupported={isMicSupported}
                  onToggleMic={() => toggleListening(input)}
                  minLength={5}
                  label=""
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`p-3 rounded-lg shrink-0 ${theme.accentBg} disabled:opacity-50`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="lg:col-span-4">
        <InterviewRightPanel
          isActive
          isCameraActive
          detectionData={detectionData}
          onDetectionUpdate={setDetectionData}
          onFaceSummaryUpdate={setFaceSummary}
          expressionScore={expressionScore}
          eyeContactScore={eyeContactScore}
          postureScore={postureScore}
          onExpressionScore={setExpressionScore}
          onEyeContactScore={setEyeContactScore}
          onPostureScore={setPostureScore}
          onObservation={() => {}}
          sessionId={null}
          userId="real"
          interviewStartTime={interviewStartTime}
          sessionAnswerCount={userRoundCount}
          lowHeadCount={lowHeadCount}
          onLowHeadDetected={() => setLowHeadCount((c) => c + 1)}
        />
      </aside>
    </div>
  );
};

export default RealInterview;
