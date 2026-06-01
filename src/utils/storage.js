const STORAGE_KEYS = {
  USER_PROGRESS: 'mianba_user_progress',
  WRONG_ANSWERS: 'mianba_wrong_answers',
  PRACTICE_HISTORY: 'mianba_practice_history',
};

export const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('获取本地存储数据失败:', error);
    return null;
  }
};

export const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('保存本地存储数据失败:', error);
    return false;
  }
};

const defaultProgress = () => ({
  practiceCount: 0,
  scoreHistory: [],
  practiceDays: [],
  questionsAnswered: 0,
  correctAnswers: 0,
  practicedQuestions: [],
});

export const getUserProgress = () => {
  const stored = getStorageData(STORAGE_KEYS.USER_PROGRESS);
  if (!stored) return defaultProgress();
  return { ...defaultProgress(), ...stored };
};

export const updateUserProgress = (progress) => {
  return setStorageData(STORAGE_KEYS.USER_PROGRESS, progress);
};

/** 记录一次练习得分，更新总次数、平均分相关数据、本周练习天数 */
export const recordPracticeScore = (score) => {
  const progress = getUserProgress();
  const today = new Date().toISOString().slice(0, 10);
  const practiceDays = progress.practiceDays || [];
  const nextDays = practiceDays.includes(today)
    ? practiceDays
    : [...practiceDays, today].slice(-120);

  const next = {
    ...progress,
    practiceCount: (progress.practiceCount || 0) + 1,
    questionsAnswered: (progress.questionsAnswered || 0) + 1,
    correctAnswers: (progress.correctAnswers || 0) + 1,
    scoreHistory: [...(progress.scoreHistory || []), score].slice(-200),
    practiceDays: nextDays,
  };
  updateUserProgress(next);
  return next;
};

export const getPracticeStats = (progress) => {
  const scores = progress?.scoreHistory || [];
  const practiceCount = progress?.practiceCount ?? progress?.questionsAnswered ?? 0;
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = weekAgo.toISOString().slice(0, 10);
  const days = progress?.practiceDays || [];
  const weeklyPracticeDays = days.filter((d) => d >= weekStart).length;

  return { practiceCount, avgScore, maxScore, weeklyPracticeDays };
};

export const getWrongAnswers = () => {
  return getStorageData(STORAGE_KEYS.WRONG_ANSWERS) || [];
};

export const addWrongAnswer = (wrongAnswer) => {
  const wrongAnswers = getWrongAnswers();
  wrongAnswer.id = Date.now().toString();
  wrongAnswer.timestamp = new Date().toISOString();
  wrongAnswers.unshift(wrongAnswer);

  if (wrongAnswers.length > 50) {
    wrongAnswers.splice(50);
  }

  return setStorageData(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers);
};

export const removeWrongAnswer = (id) => {
  const wrongAnswers = getWrongAnswers();
  const filtered = wrongAnswers.filter((item) => item.id !== id);
  return setStorageData(STORAGE_KEYS.WRONG_ANSWERS, filtered);
};

export const getPracticeHistory = () => {
  return getStorageData(STORAGE_KEYS.PRACTICE_HISTORY) || [];
};

export const addPracticeRecord = (record) => {
  const history = getPracticeHistory();
  record.id = Date.now().toString();
  record.timestamp = new Date().toISOString();
  history.unshift(record);

  if (history.length > 100) {
    history.splice(100);
  }

  return setStorageData(STORAGE_KEYS.PRACTICE_HISTORY, history);
};
