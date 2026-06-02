import React from 'react';
import { BookOpen, MessageCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const HomeHub = ({ onSelectPractice, onSelectReal }) => {
  const { theme, isDark } = useTheme();

  return (
    <div className="py-8">
      <h2 className={`text-2xl font-bold text-center mb-2 ${theme.pageText}`}>选择训练模式</h2>
      <p className={`text-center text-sm mb-10 ${theme.muted}`}>
        题库练习适合刷题；真实面试模拟多轮对�?
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onSelectPractice}
          className={`p-8 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${theme.cardBg} hover:border-blue-500/50 group`}
        >
          <BookOpen className={`w-10 h-10 mb-4 ${isDark ? 'text-amber-400' : 'text-blue-600'}`} />
          <h3 className={`text-xl font-bold mb-2 ${theme.pageText}`}>题库练习</h3>
          <p className={`text-sm ${theme.muted}`}>
            按岗位刷真题，AI 逐题评分，支持收藏与错题�?
          </p>
          <span className={`inline-block mt-4 text-sm font-medium ${theme.accent}`}>
            开始练�?�?
          </span>
        </button>

        <button
          type="button"
          onClick={onSelectReal}
          className={`p-8 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${theme.cardBg} hover:border-emerald-500/50 group`}
        >
          <MessageCircle className={`w-10 h-10 mb-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <h3 className={`text-xl font-bold mb-2 ${theme.pageText}`}>真实面试</h3>
          <p className={`text-sm ${theme.muted}`}>
            AI 面试官多轮追问，5-8 轮对话后给出整场综合评价
          </p>
          <span className="inline-block mt-4 text-sm font-medium text-emerald-500">
            进入面试 �?
          </span>
        </button>
      </div>
    </div>
  );
};

export const BackHomeButton = ({ onClick }) => {
  const { theme } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-4 flex items-center gap-1 text-sm ${theme.muted} ${theme.accent} opacity-80 hover:opacity-100`}
    >
      <ArrowLeft className="w-4 h-4" />
      返回主页
    </button>
  );
};

export default HomeHub;
