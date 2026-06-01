import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Trophy, TrendingDown, Copy, Check, X } from 'lucide-react';

const InterviewSummary = ({
  qaList,
  onClose,
  onExport,
  exportCopied,
  nickname,
  positionName,
  durationText,
  avgScore,
}) => {
  const chartData = qaList.map((item, i) => ({
    name: `Q${i + 1}`,
    score: item.score ?? 0,
  }));

  const sorted = [...qaList].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="bg-[#121820] border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-amber-400">本次面试总结</h2>
            <p className="text-gray-400 text-sm mt-1">
              {nickname} · {positionName} · {durationText} · 平均 {avgScore} 分
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">各题得分趋势</h3>
          <div className="h-48 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#121820',
                    border: '1px solid #374151',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#d4af37"
                  strokeWidth={2}
                  dot={{ fill: '#d4af37', r: 4 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {best && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/40">
              <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                <Trophy className="w-4 h-4" />
                最佳回答（{best.score}分）
              </div>
              <p className="text-sm text-gray-400 mb-1">{best.question}</p>
              <p className="text-sm text-gray-300 line-clamp-3">{best.answer}</p>
            </div>
          )}

          {worst && qaList.length > 1 && (
            <div className="mb-6 p-4 rounded-xl bg-orange-900/20 border border-orange-800/40">
              <div className="flex items-center gap-2 text-orange-400 font-medium mb-2">
                <TrendingDown className="w-4 h-4" />
                最需改进（{worst.score}分）
              </div>
              <p className="text-sm text-gray-400 mb-1">{worst.question}</p>
              <p className="text-sm text-gray-300 line-clamp-3">{worst.answer}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onExport}
            className="w-full py-3 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-[#0a0e17] font-semibold rounded-lg"
          >
            {exportCopied ? (
              <>
                <Check className="w-4 h-4" /> 已复制到剪贴板
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> 导出报告（复制到剪贴板）
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewSummary;
