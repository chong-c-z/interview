const KEYS = {
  NICKNAME: 'jingmian_nickname',
  HISTORY: 'jingmian_interview_history',
  FAVORITES: 'jingmian_favorite_questions',
};

export const getNickname = () =>
  localStorage.getItem(KEYS.NICKNAME) || '面试者';

export const setNickname = (name) => {
  const trimmed = (name || '').trim();
  if (trimmed) localStorage.setItem(KEYS.NICKNAME, trimmed.slice(0, 12));
};

export const getInterviewHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
};

export const addInterviewHistory = (record) => {
  const list = getInterviewHistory();
  const entry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...record,
  };
  const next = [entry, ...list].slice(0, 10);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(next));
  return next;
};

export const getFavoriteQuestions = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.FAVORITES) || '[]');
  } catch {
    return [];
  }
};

export const toggleFavoriteQuestion = (questionItem) => {
  const list = getFavoriteQuestions();
  const exists = list.find((q) => q.id === questionItem.id);
  let next;
  if (exists) {
    next = list.filter((q) => q.id !== questionItem.id);
  } else {
    next = [
      {
        id: questionItem.id,
        question: questionItem.question,
        position: questionItem.position,
        category: questionItem.category,
        keywords: questionItem.keywords,
        addedAt: new Date().toISOString(),
      },
      ...list,
    ];
  }
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(next));
  return next;
};

export const isQuestionFavorited = (questionId) =>
  getFavoriteQuestions().some((q) => q.id === questionId);

export const removeFavoriteQuestion = (questionId) => {
  const next = getFavoriteQuestions().filter((q) => q.id !== questionId);
  localStorage.setItem(KEYS.FAVORITES, JSON.stringify(next));
  return next;
};

export const buildExportReport = ({
  nickname,
  position,
  duration,
  qaList,
  faceSummary,
  avgScore,
}) => {
  const positionNames = { product: '产品', frontend: '前端', operation: '运营' };
  const lines = [
    '══════════════════════════════════',
    '           镜面 · 面试练习报告',
    '══════════════════════════════════',
    '',
    `面试者：${nickname}`,
    `岗位：${positionNames[position] || position}`,
    `时长：${duration}`,
    `平均分：${avgScore} 分`,
    `生成时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    '【表情表现】',
    faceSummary?.comment || '暂无数据',
    '',
    '【问答记录】',
  ];

  qaList.forEach((item, i) => {
    lines.push(
      '',
      `--- 第 ${i + 1} 题 (${item.score ?? '-'}分) ---`,
      `题目：${item.question}`,
      `回答：${item.answer}`,
      item.comment ? `评价：${item.comment}` : '',
      item.improvements?.length
        ? `建议：\n${item.improvements.map((s) => `  · ${s}`).join('\n')}`
        : ''
    );
  });

  lines.push('', '══════════════════════════════════', '由镜面 AI 面试训练系统生成');
  return lines.join('\n');
};
