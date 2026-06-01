import React from 'react';
import { BarChart3, Calendar, Target, Trophy } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getPracticeStats } from '../utils/storage';

const CompactSidebar = ({ progress }) => {
  const { theme, isDark } = useTheme();
  const { practiceCount, avgScore, maxScore, weeklyPracticeDays } =
    getPracticeStats(progress);

  const statCard = isDark
    ? 'p-2.5 rounded-lg bg-[#0a0e17] border border-gray-800 text-center'
    : 'p-2.5 rounded-lg bg-white border border-slate-200 text-center shadow-sm';

  const statValue = isDark ? 'text-base font-bold text-blue-400' : 'text-base font-bold text-blue-600';
  const statLabel = isDark ? 'text-[10px] text-gray-500' : 'text-[10px] text-slate-500';
  const iconClass = isDark ? 'w-3.5 h-3.5 text-gray-500 mx-auto mb-1' : 'w-3.5 h-3.5 text-slate-400 mx-auto mb-1';

  return (
    <div className="space-y-3">
      <div className={`text-xs font-medium ${theme.muted}`}>练习数据</div>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={Target}
          label="总练习次数"
          value={practiceCount}
          statCard={statCard}
          statValue={statValue}
          statLabel={statLabel}
          iconClass={iconClass}
        />
        <Stat
          icon={BarChart3}
          label="平均得分"
          value={avgScore > 0 ? `${avgScore}` : '-'}
          statCard={statCard}
          statValue={statValue}
          statLabel={statLabel}
          iconClass={iconClass}
        />
        <Stat
          icon={Trophy}
          label="最高得分"
          value={maxScore > 0 ? `${maxScore}` : '-'}
          statCard={statCard}
          statValue={statValue}
          statLabel={statLabel}
          iconClass={iconClass}
        />
        <Stat
          icon={Calendar}
          label="本周练习天数"
          value={weeklyPracticeDays}
          statCard={statCard}
          statValue={statValue}
          statLabel={statLabel}
          iconClass={iconClass}
        />
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, statCard, statValue, statLabel, iconClass }) => (
  <div className={statCard}>
    <Icon className={iconClass} />
    <div className={statValue}>{value}</div>
    <div className={statLabel}>{label}</div>
  </div>
);

export default CompactSidebar;
