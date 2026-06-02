import React, { useEffect, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Sparkles, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ModelAnswerPanel from './ModelAnswerPanel';

const DIMENSION_LABELS = {
  content: '内容',
  logic: '逻辑',
  specific: '具体',
  match: '匹配',
};

function useAnimatedNumber(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

const ScoreResultCard = ({
  aiAnalysis,
  timeUsed,
  isUnderPressure,
  question,
  position,
  keywords,
  onContinue,
  onFavorite,
  isFavorited,
  isDark: isDarkProp,
}) => {
  const { theme, isDark: isDarkCtx } = useTheme();
  const isDark = isDarkProp ?? isDarkCtx;
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const score = aiAnalysis?.score ?? 0;
  const animatedScore = useAnimatedNumber(score);

  const dims = aiAnalysis?.dimensions || {};
  const radarData = [
    { subject: '内容', value: dims.content ?? 0, fullMark: 25 },
    { subject: '逻辑', value: dims.logic ?? 0, fullMark: 25 },
    { subject: '具体', value: dims.specific ?? 0, fullMark: 25 },
    { subject: '匹配', value: dims.match ?? 0, fullMark: 25 },
  ];

  const isFallback =
    aiAnalysis?.fallback === true && aiAnalysis?.fromBackend !== true;

  const scoreColor =
    score >= 80
      ? isDark
        ? 'text-emerald-400'
        : 'text-emerald-600'
      : score >= 60
        ? isDark
          ? 'text-blue-400'
          : 'text-blue-600'
        : isDark
          ? 'text-red-400'
          : 'text-red-600';

  const panelClass = isDark
    ? 'bg-[#121820] border-gray-700'
    : 'bg-white border-slate-200 shadow-xl';
  const dimBox = isDark
    ? 'bg-[#0a0e17] border-gray-800'
    : 'bg-slate-50 border-slate-200';
  const dimValue = isDark ? 'text-blue-400' : 'text-blue-600';
  const radarStroke = isDark ? '#3b82f6' : '#2563eb';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className={`border rounded-2xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto ${panelClass}`}>
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${scoreColor} tabular-nums`}>
            {animatedScore}
          </div>
          <div className={`text-sm mt-1 ${theme.muted}`}>综合得分 / 100</div>
        </div>

        {isFallback && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm border ${
              isDark
                ? 'bg-blue-900/30 border-blue-700/50 text-blue-200'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            后端 AI 暂不可用，以下为本地规则评分
          </div>
        )}

        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke={isDark ? '#374151' : '#e2e8f0'} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 25]}
                tick={{ fill: isDark ? '#6b7280' : '#94a3b8', fontSize: 10 }}
              />
              <Radar
                name="得分"
                dataKey="value"
                stroke={radarStroke}
                fill={radarStroke}
                fillOpacity={0.35}
                animationDuration={1200}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
            <div key={key} className={`text-center p-2 rounded-lg border ${dimBox}`}>
              <div className={`text-xs ${theme.muted}`}>{label}</div>
              <div className={`text-lg font-bold ${dimValue}`}>{dims[key] ?? '-'}</div>
            </div>
          ))}
        </div>

        {aiAnalysis?.highlight && (
          <div
            className={`mb-4 p-3 rounded-lg flex gap-2 border ${
              isDark
                ? 'bg-emerald-900/20 border-emerald-700/40'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
            />
            <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
              {aiAnalysis.highlight}
            </p>
          </div>
        )}

        <div className={`mb-4 p-4 rounded-lg border ${dimBox}`}>
          <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${theme.accent}`}>
            <TrendingUp className="w-4 h-4" />
            面试官评价
          </div>
          <p className={`text-sm leading-relaxed ${theme.pageText}`}>
            {aiAnalysis?.detailedEvaluation || '暂无评价'}
          </p>
        </div>

        {aiAnalysis?.suggestions?.length > 0 && (
          <div className="mb-6">
            <h4 className={`text-sm font-medium mb-2 ${theme.muted}`}>改进建议</h4>
            <ul className="space-y-2">
              {aiAnalysis.suggestions.map((s, i) => (
                <li
                  key={i}
                  className={`text-sm pl-3 border-l-2 ${
                    isDark ? 'text-gray-300 border-blue-500/50' : 'text-slate-700 border-blue-300'
                  }`}
                >
                  {s.message || s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`flex items-center justify-between text-sm mb-4 ${theme.muted}`}>
          <span>用时 {timeUsed} 秒</span>
          {isUnderPressure && (
            <span className={isDark ? 'text-red-400' : 'text-red-600'}>压力模式</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowModelAnswer(true)}
            className={`w-full py-2.5 rounded-lg border transition-colors ${
              isDark
                ? 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
          >
            查看示范回答
          </button>
          <button
            type="button"
            onClick={onFavorite}
            className={`w-full py-2.5 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
              isFavorited
                ? isDark
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-blue-400 bg-blue-50 text-blue-700'
                : isDark
                  ? 'border-gray-600 text-gray-400 hover:border-gray-500'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            {isFavorited ? '已收藏本题' : '收藏本题'}
          </button>
          <button
            type="button"
            onClick={onContinue}
            className={`w-full py-3 font-semibold rounded-lg transition-colors ${theme.accentBg}`}
          >
            继续面试
          </button>
        </div>

        {showModelAnswer && (
          <ModelAnswerPanel
            question={question}
            position={position}
            keywords={keywords}
            onClose={() => setShowModelAnswer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ScoreResultCard;