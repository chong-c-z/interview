import React from 'react';
import { User, Star, Target, TrendingUp, BookOpen } from 'lucide-react';
import { getRankByExp, getExpForNextRank } from '../utils/rankSystem';

const UserProgress = ({ progress, wrongAnswersCount, isDarkMode = false }) => {
  const currentRank = getRankByExp(progress.totalExp);
  const nextRankInfo = getExpForNextRank(progress.totalExp);

  const accuracy =
    progress.questionsAnswered > 0
      ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
      : 0;

  const containerClass = isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-gray-50 border-gray-200';

  const titleClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const expClass = isDarkMode ? 'text-blue-400' : 'text-blue-600';
  const progressBg = isDarkMode ? 'bg-gray-700' : 'bg-gray-200';

  const statCards = [
    {
      key: 'accuracy',
      icon: Target,
      label: '正确�?,
      value: `${accuracy}%`,
      light: 'bg-blue-50 text-blue-700 border-blue-100',
      dark: 'bg-blue-900 text-blue-400',
      iconLight: 'text-blue-600',
      iconDark: 'text-blue-400',
    },
    {
      key: 'streak',
      icon: TrendingUp,
      label: '连胜',
      value: progress.streak,
      light: 'bg-green-50 text-green-700 border-green-100',
      dark: 'bg-green-900 text-green-400',
      iconLight: 'text-green-600',
      iconDark: 'text-green-400',
    },
    {
      key: 'practiced',
      icon: Star,
      label: '已练�?,
      value: progress.questionsAnswered,
      light: 'bg-purple-50 text-purple-700 border-purple-100',
      dark: 'bg-purple-900 text-purple-400',
      iconLight: 'text-purple-600',
      iconDark: 'text-purple-400',
    },
    {
      key: 'wrong',
      icon: BookOpen,
      label: '错题',
      value: wrongAnswersCount,
      light: 'bg-red-50 text-red-700 border-red-100',
      dark: 'bg-red-900 text-red-400',
      iconLight: 'text-red-600',
      iconDark: 'text-red-400',
    },
  ];

  return (
    <div className={`rounded-lg p-4 shadow-sm border ${containerClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`w-12 h-12 rounded-full ${currentRank.bgColor} flex items-center justify-center mr-3`}
          >
            <User className={`w-6 h-6 ${currentRank.color}`} />
          </div>
          <div>
            <h3 className={`font-bold ${titleClass}`}>面试�?/h3>
            <p className={`text-sm ${currentRank.color} font-medium`}>
              {currentRank.name}段位
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-bold ${expClass}`}>{progress.totalExp}</div>
          <div className={`text-xs ${subTextClass}`}>经验�?/div>
        </div>
      </div>

      {nextRankInfo && (
        <div className="mb-4">
          <div className={`flex justify-between text-xs ${subTextClass} mb-1`}>
            <span>升级进度</span>
            <span>{nextRankInfo.remaining}经验值后升级</span>
          </div>
          <div className={`w-full ${progressBg} rounded-full h-2`}>
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  ((progress.totalExp -
                    (nextRankInfo.nextExp - nextRankInfo.remaining)) /
                    nextRankInfo.remaining) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {statCards.map(
          ({ key, icon: Icon, label, value, light, dark, iconLight, iconDark }) => (
            <div
              key={key}
              className={`text-center p-3 rounded-lg border ${
                isDarkMode ? dark : light
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                <Icon
                  className={`w-4 h-4 mr-1 ${isDarkMode ? iconDark : iconLight}`}
                />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
              <div className="text-lg font-bold">{value}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default UserProgress;
