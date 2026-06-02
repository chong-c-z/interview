import React, { useEffect, useState } from 'react';
import FaceDetection from './FaceDetection';
import InterviewerObservation from './InterviewerObservation';
import { Smile, Eye, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const formatFocusDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}分${s}秒`;
};

const InterviewRightPanel = ({
  isActive,
  isCameraActive,
  detectionData,
  onDetectionUpdate,
  onFaceSummaryUpdate,
  expressionScore,
  eyeContactScore,
  postureScore,
  onExpressionScore,
  onEyeContactScore,
  onPostureScore,
  onObservation,
  sessionId,
  userId,
  interviewStartTime,
  sessionAnswerCount,
  lowHeadCount,
  onLowHeadDetected,
}) => {
  const { isDark } = useTheme();
  const [focusMs, setFocusMs] = useState(0);

  useEffect(() => {
    if (!isActive || !interviewStartTime) return;
    const tick = () => setFocusMs(Date.now() - interviewStartTime);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, interviewStartTime]);

  useEffect(() => {
    if (detectionData?.headDown) {
      onLowHeadDetected?.();
    }
  }, [detectionData?.headDown, detectionData?.timestamp, onLowHeadDetected]);

  const scoreClass = (score) => {
    if (isDark) {
      return score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
    }
    return score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  };

  const cardClass = isDark
    ? 'rounded-xl border border-gray-800 bg-[#121820] p-3'
    : 'rounded-xl border border-gray-200 bg-white p-3 shadow-sm';

  const titleClass = isDark
    ? 'text-xs font-medium text-gray-500 uppercase tracking-wider mb-2'
    : 'text-xs font-medium text-gray-400 uppercase tracking-wider mb-2';

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* 摄像头卡片 */}
      <div className={`${cardClass} shrink-0`}>
        <h3 className={titleClass}>面试者画面</h3>
        <FaceDetection
          onDetectionUpdate={onDetectionUpdate}
          isActive={isCameraActive}
          onExpressionScore={onExpressionScore}
          onEyeContactScore={onEyeContactScore}
          onPostureScore={onPostureScore}
          onFaceSummaryUpdate={onFaceSummaryUpdate}
        />
      </div>

      {/* AI实时评分卡片 */}
      <div className={`${cardClass} shrink-0`}>
        <h3 className={titleClass}>AI 实时评分</h3>
        <div className="space-y-2.5">
          <ScoreRow icon={Smile} label="表情" score={expressionScore} scoreClass={scoreClass} isDark={isDark} />
          <ScoreRow icon={Eye} label="眼神" score={eyeContactScore} scoreClass={scoreClass} isDark={isDark} />
          <ScoreRow icon={User} label="姿态" score={postureScore} scoreClass={scoreClass} isDark={isDark} />
        </div>
      </div>

      {/* 面试官观察卡片 */}
      <div className={isDark
        ? 'rounded-xl border border-gray-800 bg-[#121820] flex-1 min-h-0 flex flex-col overflow-hidden'
        : 'rounded-xl border border-gray-200 bg-white shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden'
      }>
        <InterviewerObservation
          detection={detectionData}
          isActive={isActive}
          onObservation={onObservation}
          sessionId={sessionId}
          userId={userId}
          focusDurationText={formatFocusDuration(focusMs)}
          lowHeadCount={lowHeadCount}
          sessionAnswerCount={sessionAnswerCount}
        />
      </div>
    </div>
  );
};

const ScoreRow = ({ icon: Icon, label, score, scoreClass, isDark }) => (
  <div className="flex items-center justify-between">
    <span className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
    <span className={`text-sm font-bold tabular-nums ${scoreClass(score)}`}>{score}</span>
  </div>
);

export default InterviewRightPanel;