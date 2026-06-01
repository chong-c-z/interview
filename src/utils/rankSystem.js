export const ranks = {
  bronze: { name: '青铜', minExp: 0, maxExp: 99, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  silver: { name: '白银', minExp: 100, maxExp: 299, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  gold: { name: '黄金', minExp: 300, maxExp: 599, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  master: { name: '面霸', minExp: 600, maxExp: Infinity, color: 'text-purple-600', bgColor: 'bg-purple-100' }
};

export const getRankByExp = (exp) => {
  for (const [key, rank] of Object.entries(ranks)) {
    if (exp >= rank.minExp && exp <= rank.maxExp) {
      return { ...rank, key };
    }
  }
  return ranks.bronze;
};

export const getExpForNextRank = (currentExp) => {
  const currentRank = getRankByExp(currentExp);
  if (currentRank.key === 'master') return null;
  
  const nextRankKey = currentRank.key === 'bronze' ? 'silver' : 
                     currentRank.key === 'silver' ? 'gold' : 'master';
  const nextRank = ranks[nextRankKey];
  
  return {
    nextExp: nextRank.minExp,
    remaining: nextRank.minExp - currentExp
  };
};

export const calculateExpGain = (difficulty, correctKeywords, totalKeywords) => {
  const baseExp = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
  const keywordBonus = Math.floor((correctKeywords / totalKeywords) * baseExp);
  return baseExp + keywordBonus;
};
