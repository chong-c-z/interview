import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Camera,
  CameraOff,
  Clock,
  FileText,
  History,
  Moon,
  RotateCcw,
  Star,
  Sun,
  Zap,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import HomeHub, { BackHomeButton } from '../components/HomeHub';
import RealInterview from '../components/RealInterview';
import { analyzeAnswerWithAI } from '../utils/aiAnalysis';
import { questionBank, QUESTION_CATEGORIES } from '../data/questions';
import {
  updateUserProgress,
  addPracticeRecord,
  getUserProgress,
  recordPracticeScore,
} from '../utils/storage';
import { createInterviewSession, endInterviewSession } from '../utils/database';
import { BACKEND_OFFLINE_MSG } from '../services/backendApi';
import {
  getNickname,
  addInterviewHistory,
  getInterviewHistory,
  getFavoriteQuestions,
  toggleFavoriteQuestion,
  isQuestionFavorited,
  removeFavoriteQuestion,
  buildExportReport,
} from '../utils/appStorage';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import SplashScreen from '../components/SplashScreen';
import CompactSidebar from '../components/CompactSidebar';
import AnswerInput from '../components/AnswerInput';
import ScoreResultCard from '../components/ScoreResultCard';
import InterviewRightPanel from '../components/InterviewRightPanel';
import InterviewSummary from '../components/InterviewSummary';
import UserNickname from '../components/UserNickname';
import HistoryModal from '../components/HistoryModal';
import FavoritesBook from '../components/FavoritesBook';
import WrongAnswerBook from '../components/WrongAnswerBook';
import CelebrationAnimation from '../components/CelebrationAnimation';
import InterviewerReport from '../components/InterviewerReport';

const MIN_ANSWER_LENGTH = 15;
const QUESTION_TIME_LIMIT = 120;

const Index = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [mainView, setMainView] = useState('home');
  const [realPosition, setRealPosition] = useState(null);
  const [positionSelected, setPositionSelected] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userProgress, setUserProgress] = useState(getUserProgress());
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [favorites, setFavorites] = useState(getFavoriteQuestions());
  const [history, setHistory] = useState(getInterviewHistory());
  const [showWrongAnswerBook, setShowWrongAnswerBook] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [isPressureMode, setIsPressureMode] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedbackData, setFeedbackData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreparationTimer, setShowPreparationTimer] = useState(false);
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(30);
  const [interviewerThinking, setInterviewerThinking] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [isQuestionTimerActive, setIsQuestionTimerActive] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectionData, setDetectionData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [interviewerFeedback, setInterviewerFeedback] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [userId] = useState('user_123');
  const [nickname, setNickname] = useState(getNickname);

  const [expressionScore, setExpressionScore] = useState(70);
  const [eyeContactScore, setEyeContactScore] = useState(70);
  const [postureScore, setPostureScore] = useState(70);
  const [sessionQaList, setSessionQaList] = useState([]);
  const [faceSummary, setFaceSummary] = useState({});
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [lowHeadCount, setLowHeadCount] = useState(0);

  const questionTimerRef = useRef(null);
  const preparationTimerRef = useRef(null);

  const handleTranscript = useCallback((text) => {
    setUserAnswer(text);
  }, []);

  const { isSupported: isMicSupported, isListening, toggleListening } =
    useSpeechRecognition({ onTranscript: handleTranscript, lang: 'zh-CN' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('mianba_wrong_answers') || '[]');
    setWrongAnswers(stored);
  }, []);

  useEffect(() => {
    if (mainView === 'practice' && positionSelected && currentPosition) {
      loadNewQuestion();
    }
  }, [mainView, positionSelected, currentPosition, filterCategory, filterDifficulty]);

  useEffect(() => {
    if (!isQuestionTimerActive || questionTimeLeft <= 0) return;
    questionTimerRef.current = setTimeout(() => {
      setQuestionTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearTimeout(questionTimerRef.current);
  }, [isQuestionTimerActive, questionTimeLeft]);

  useEffect(() => {
    if (questionTimeLeft === 0 && isQuestionTimerActive) {
      setIsQuestionTimerActive(false);
      handleTimeUp();
    }
  }, [questionTimeLeft, isQuestionTimerActive]);

  useEffect(() => {
    if (!showPreparationTimer || preparationTimeLeft <= 0) return;
    preparationTimerRef.current = setTimeout(() => {
      setPreparationTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearTimeout(preparationTimerRef.current);
  }, [showPreparationTimer, preparationTimeLeft]);

  useEffect(() => {
    if (preparationTimeLeft === 0 && showPreparationTimer) {
      setShowPreparationTimer(false);
    }
  }, [preparationTimeLeft, showPreparationTimer]);

  const filterQuestions = (list) => {
    let result = list;
    if (filterCategory !== 'all') {
      result = result.filter((q) => q.category === filterCategory);
    }
    if (filterDifficulty !== 'all') {
      result = result.filter((q) => q.difficulty === filterDifficulty);
    }
    return result;
  };

  const getAvailableQuestions = () => {
    const questions = questionBank[currentPosition] || [];
    const practicedIds = userProgress.practicedQuestions || [];
    const unpracticed = questions.filter((q) => !practicedIds.includes(q.id));
    const filtered = filterQuestions(unpracticed);
    if (filtered.length > 0) return filtered;
    return filterQuestions(questions);
  };

  const handleSelectPosition = (position) => {
    setCurrentPosition(position);
    setPositionSelected(true);
    setAnswerError('');
    setUserAnswer('');
    setShowFeedback(false);
  };

  const loadNewQuestion = () => {
    if (!currentPosition) return;
    const available = getAvailableQuestions();
    const pool =
      available.length > 0 ? available : questionBank[currentPosition];
    const q = pool[Math.floor(Math.random() * pool.length)];
    setCurrentQuestion(q);
    setUserAnswer('');
    setShowFeedback(false);
    setShowPreparationTimer(true);
    setPreparationTimeLeft(30);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setIsQuestionTimerActive(true);
    setQuestionStartTime(Date.now());
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (isQuestionFavorited(q.id)) next.add(q.id);
      return next;
    });
  };

  const getPositionName = (position) => {
    const names = { product: '产品', frontend: '前端', operation: '运营' };
    return names[position];
  };

  const getQuestionTimerColor = () => {
    if (questionTimeLeft > 60) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (questionTimeLeft > 30) return isDark ? 'text-blue-400' : 'text-blue-600';
    return 'text-red-500';
  };

  const formatQuestionTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeUp = () => {
    if (userAnswer.trim().length >= MIN_ANSWER_LENGTH) {
      handleSubmitAnswer();
    } else {
      setAnswerError(`回答太简短，请至少输入${MIN_ANSWER_LENGTH}个字`);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    const trimmed = userAnswer.trim();
    if (trimmed.length < MIN_ANSWER_LENGTH) {
      setAnswerError(`回答太简短，请至少输入${MIN_ANSWER_LENGTH}个字`);
      return;
    }

    setAnswerError('');
    setIsQuestionTimerActive(false);
    setIsAnalyzing(true);

    try {
      const timeUsed = questionStartTime
        ? Math.round((Date.now() - questionStartTime) / 1000)
        : 0;

      setInterviewerThinking(true);
      await new Promise((r) => setTimeout(r, 1000));
      setInterviewerThinking(false);

      const aiAnalysis = await analyzeAnswerWithAI(
        userAnswer,
        currentQuestion.keywords,
        currentQuestion.question,
        currentPosition
      );

      const score = aiAnalysis.score ?? 0;
      const newProgress = {
        ...recordPracticeScore(score),
        practicedQuestions: [
          ...(userProgress.practicedQuestions || []),
          currentQuestion.id,
        ],
      };
      setUserProgress(newProgress);
      updateUserProgress(newProgress);

      if (score >= 85) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2500);
      }

      addPracticeRecord({
        question: currentQuestion.question,
        position: currentPosition,
        difficulty: currentQuestion.difficulty,
        timeUsed,
        score,
        isCorrect: true,
      });

      const qaEntry = {
        question: currentQuestion.question,
        answer: userAnswer,
        score: aiAnalysis.score,
        comment: aiAnalysis.detailedEvaluation,
        improvements: aiAnalysis.suggestions?.map((s) => s.message || s) || [],
      };

      if (isInterviewMode) {
        setSessionQaList((prev) => [...prev, qaEntry]);
      }

      setFeedbackData({
        timeUsed,
        isUnderPressure: isPressureMode,
        userAnswer,
        keywords: currentQuestion.keywords,
        question: currentQuestion.question,
        position: currentPosition,
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        aiAnalysis,
      });
      setShowFeedback(true);
    } catch (error) {
      console.error('提交失败:', error);
      setAnswerError(
        error.message === BACKEND_OFFLINE_MSG
          ? BACKEND_OFFLINE_MSG
          : '评分失败，请稍后重试'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    loadNewQuestion();
  };

  const handleFavoriteToggle = () => {
    if (!feedbackData || !currentQuestion) return;
    const item = {
      id: currentQuestion.id,
      question: currentQuestion.question,
      position: currentPosition,
      category: currentQuestion.category,
      keywords: currentQuestion.keywords,
    };
    const next = toggleFavoriteQuestion(item);
    setFavorites(next);
    setFavoritedIds(new Set(next.map((f) => f.id)));
  };

  const handleLowHeadDetected = useCallback(() => {
    setLowHeadCount((c) => c + 1);
  }, []);

  const finishInterviewSession = () => {
    if (sessionQaList.length > 0) {
      const avg =
        Math.round(
          sessionQaList.reduce((s, q) => s + (q.score || 0), 0) / sessionQaList.length
        ) || 0;
      const record = {
        position: currentPosition,
        avgScore: avg,
        questionCount: sessionQaList.length,
      };
      setHistory(addInterviewHistory(record));
      setShowSummary(true);
    }
    if (sessionId) {
      endInterviewSession(sessionId, {
        postureScore,
        expressionScore,
        eyeContactScore,
        overallImpression: `完成 ${sessionQaList.length} 题`,
      });
    }
  };

  const toggleInterviewMode = () => {
    if (isInterviewMode) {
      setIsCameraActive(false);
      setDetectionData(null);
      finishInterviewSession();
      setIsInterviewMode(false);
    } else {
      setIsInterviewMode(true);
      setIsCameraActive(true);
      setObservations([]);
      setSessionQaList([]);
      setFaceSummary({});
      setLowHeadCount(0);
      setInterviewStartTime(Date.now());
      setExpressionScore(70);
      setEyeContactScore(70);
      setPostureScore(70);
      createInterviewSession(userId).then((session) => {
        if (session) setSessionId(session.id);
      });
    }
  };

  const handleExportReport = async () => {
    const avg =
      sessionQaList.length > 0
        ? Math.round(
            sessionQaList.reduce((s, q) => s + (q.score || 0), 0) / sessionQaList.length
          )
        : 0;
    const durationMin = interviewStartTime
      ? Math.max(1, Math.round((Date.now() - interviewStartTime) / 60000))
      : 1;
    const text = buildExportReport({
      nickname,
      position: currentPosition,
      duration: `${durationMin} 分钟`,
      qaList: sessionQaList,
      faceSummary,
      avgScore: avg,
    });
    try {
      await navigator.clipboard.writeText(text);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 3000);
    } catch {
      alert('复制失败，请手动选择文本复制');
    }
  };

  const goHome = () => {
    setMainView('home');
    setPositionSelected(false);
    setCurrentPosition(null);
    setRealPosition(null);
    setIsInterviewMode(false);
    setIsCameraActive(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} duration={2000} />;
  }

  if (mainView === 'real' && realPosition) {
    return (
      <div className={`min-h-screen ${theme.pageBg} ${theme.pageText}`}>
        <AppHeader
          theme={theme}
          isDark={isDark}
          toggleTheme={toggleTheme}
          nickname={nickname}
          setNickname={setNickname}
          onHistory={() => setShowHistory(true)}
        />
        <main className="max-w-[1600px] mx-auto px-4 py-4">
          <RealInterview
            position={realPosition}
            positionName={getPositionName(realPosition)}
            nickname={nickname}
            onBack={goHome}
          />
        </main>
        {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} />}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.pageText}`}>
      <AppHeader
        theme={theme}
        isDark={isDark}
        toggleTheme={toggleTheme}
        nickname={nickname}
        setNickname={setNickname}
        onHistory={() => setShowHistory(true)}
      />

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {mainView === 'home' ? (
          <div className={`rounded-xl border p-6 ${theme.cardBg}`}>
            <HomeHub
              onSelectPractice={() => setMainView('practice')}
              onSelectReal={() => setMainView('real')}
            />
          </div>
        ) : mainView === 'real' && !realPosition ? (
          <div className={`rounded-xl border p-6 ${theme.cardBg}`}>
            <BackHomeButton onClick={goHome} />
            <RealPositionPicker
              onSelect={(pos) => setRealPosition(pos)}
              getPositionName={getPositionName}
              theme={theme}
            />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 min-h-[calc(100vh-80px)]">
          <aside className="lg:col-span-2 space-y-3">
            <BackHomeButton onClick={goHome} />
            <div className={`rounded-xl border p-4 ${theme.cardBg}`}>
              <CompactSidebar progress={userProgress} />
            </div>
            <div className="space-y-2">
              <SideBtn theme={theme} isDark={isDark} icon={BookOpen} label={`错题本(${wrongAnswers.length})`} onClick={() => setShowWrongAnswerBook(true)} />
              <SideBtn theme={theme} isDark={isDark} icon={Star} label={`收藏 (${favorites.length})`} onClick={() => setShowFavorites(true)} />
              <SideBtn
                theme={theme}
                isDark={isDark}
                icon={Zap}
                label={isPressureMode ? '关闭压力模式' : '压力模式'}
                onClick={() => setIsPressureMode(!isPressureMode)}
                active={isPressureMode}
              />
              <SideBtn
                theme={theme}
                isDark={isDark}
                icon={isInterviewMode ? CameraOff : Camera}
                label={isInterviewMode ? '结束面试' : '开始面试'}
                onClick={toggleInterviewMode}
                disabled={!positionSelected}
                active={isInterviewMode}
              />
              {isInterviewMode && sessionQaList.length > 0 && (
                <SideBtn theme={theme} isDark={isDark} icon={FileText} label="观察报告" onClick={() => setShowReport(true)} />
              )}
            </div>
          </aside>

          {/* 中间 */}
          <section className="lg:col-span-7">
            <div className={`rounded-xl border p-5 h-full ${theme.cardBg}`}>
              {!positionSelected ? (
                <PositionPicker onSelect={handleSelectPosition} getPositionName={getPositionName} theme={theme} />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {Object.keys(questionBank).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleSelectPosition(pos)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPosition === pos
                            ? theme.accentBg
                            : theme.btnSecondary
                        }`}
                      >
                        {getPositionName(pos)}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <div className={`text-xs mb-1.5 ${theme.muted}`}>题目类型</div>
                      <div className="flex flex-wrap gap-1.5">
                        <FilterChip
                          active={filterCategory === 'all'}
                          onClick={() => setFilterCategory('all')}
                          theme={theme}
                        >
                          全部
                        </FilterChip>
                        {QUESTION_CATEGORIES.map((cat) => (
                          <FilterChip
                            key={cat}
                            active={filterCategory === cat}
                            onClick={() => setFilterCategory(cat)}
                            theme={theme}
                          >
                            {cat}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs mb-1.5 ${theme.muted}`}>难度</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'all', label: '全部' },
                          { id: 'easy', label: '简单' },
                          { id: 'medium', label: '中等' },
                          { id: 'hard', label: '困难' },
                        ].map(({ id, label }) => (
                          <FilterChip
                            key={id}
                            active={filterDifficulty === id}
                            onClick={() => setFilterDifficulty(id)}
                            theme={theme}
                          >
                            {label}
                          </FilterChip>
                        ))}
                      </div>
                    </div>
                  </div>

                  {currentQuestion && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full border ${
                              isDark
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {getPositionName(currentPosition)} · {currentQuestion.category}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full border ${
                              isDark
                                ? 'bg-gray-800 text-gray-400 border-gray-700'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                         {currentQuestion.difficulty === 'easy'
                         ? '简单'
                           : currentQuestion.difficulty === 'medium'
                         ? '中等'
                         : '困难'}
                          </span>
                        </div>
                        {isQuestionTimerActive && (
                          <div
                            className={`flex items-center gap-1.5 font-mono font-bold ${getQuestionTimerColor()}`}
                          >
                            <Clock className="w-4 h-4" />
                            {formatQuestionTime(questionTimeLeft)}
                          </div>
                        )}
                      </div>

                      <h2 className={`text-lg leading-relaxed mb-5 ${theme.pageText}`}>
                        {currentQuestion.question}
                      </h2>

                      {showPreparationTimer && (
                        <div
                          className={`mb-4 p-3 rounded-lg border ${
                            isDark
                              ? 'bg-blue-500/5 border-blue-500/20'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div
                            className={`flex justify-between text-sm mb-2 ${
                              isDark ? 'text-blue-400/90' : 'text-blue-700'
                            }`}
                          >
                            <span>请准备一下，组织你的回答</span>
                            <span>{preparationTimeLeft}s</span>
                          </div>
                          <div
                            className={`h-1 rounded-full overflow-hidden ${
                              isDark ? 'bg-gray-800' : 'bg-slate-200'
                            }`}
                          >
                            <div
                              className={`h-full transition-all ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}
                              style={{ width: `${(preparationTimeLeft / 30) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <AnswerInput
                        value={userAnswer}
                        onChange={(e) => {
                          setUserAnswer(e.target.value);
                          if (answerError) setAnswerError('');
                        }}
                        onFocus={() => {}}
                        disabled={isAnalyzing}
                        isListening={isListening}
                        isMicSupported={isMicSupported}
                        onToggleMic={() => toggleListening(userAnswer)}
                        minLength={MIN_ANSWER_LENGTH}
                        answerError={answerError}
                      />

                      <div className="flex gap-3 mt-4">
                        <button
                          type="button"
                          onClick={handleSubmitAnswer}
                          disabled={
                            !userAnswer.trim() ||
                            isAnalyzing ||
                            userAnswer.trim().length < MIN_ANSWER_LENGTH
                          }
                          className={`flex-1 py-3 font-semibold rounded-lg transition-colors disabled:opacity-50 ${theme.accentBg}`}
                        >
                          {isAnalyzing ? 'AI 评分中...' : '提交回答'}
                        </button>
                        <button
                          type="button"
                          onClick={loadNewQuestion}
                          disabled={isAnalyzing}
                          className={`px-4 py-3 rounded-lg ${theme.btnSecondary}`}
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </section>

          {/* 右侧 */}
          <aside className="lg:col-span-3 min-h-[400px] lg:min-h-0">
            {isInterviewMode && positionSelected ? (
              <InterviewRightPanel
                isActive={isInterviewMode}
                isCameraActive={isCameraActive}
                detectionData={detectionData}
                onDetectionUpdate={setDetectionData}
                onFaceSummaryUpdate={setFaceSummary}
                expressionScore={expressionScore}
                eyeContactScore={eyeContactScore}
                postureScore={postureScore}
                onExpressionScore={setExpressionScore}
                onEyeContactScore={setEyeContactScore}
                onPostureScore={setPostureScore}
                onObservation={(obs) => {
                  setObservations((p) => [...p, obs]);
                  if (obs.message) {
                    setInterviewerFeedback(obs.message);
                    setTimeout(() => setInterviewerFeedback(''), 4000);
                  }
                }}
                sessionId={sessionId}
                userId={userId}
                interviewStartTime={interviewStartTime}
                sessionAnswerCount={sessionQaList.length}
                lowHeadCount={lowHeadCount}
                onLowHeadDetected={handleLowHeadDetected}
              />
            ) : (
              <div className={`rounded-xl border p-6 h-full flex flex-col items-center justify-center text-center ${theme.cardBg}`}>
                <Camera className={`w-12 h-12 mb-3 ${theme.muted}`} />
                <p className={`text-sm ${theme.muted}`}>开启「开始面试」后</p>
                <p className={`text-xs mt-1 ${theme.muted}`}>此处显示摄像头与 AI 实时分析</p>
              </div>
            )}
          </aside>
        </div>
        )}
      </main>

      {showFeedback && feedbackData && (
        <ScoreResultCard
          isDark={isDark}
          aiAnalysis={feedbackData.aiAnalysis}
          timeUsed={feedbackData.timeUsed}
          isUnderPressure={feedbackData.isUnderPressure}
          question={feedbackData.question}
          position={feedbackData.position}
          keywords={feedbackData.keywords}
          onContinue={handleContinue}
          onFavorite={handleFavoriteToggle}
          isFavorited={favoritedIds.has(feedbackData.questionId) || isQuestionFavorited(feedbackData.questionId)}
        />
      )}

      {showSummary && (
        <InterviewSummary
          qaList={sessionQaList}
          onClose={() => setShowSummary(false)}
          onExport={handleExportReport}
          exportCopied={exportCopied}
          nickname={nickname}
          positionName={getPositionName(currentPosition)}
          durationText={
            interviewStartTime
              ? `${Math.max(1, Math.round((Date.now() - interviewStartTime) / 60000))} 分钟`
              : '-'
          }
          avgScore={
            sessionQaList.length
              ? Math.round(
                  sessionQaList.reduce((s, q) => s + (q.score || 0), 0) / sessionQaList.length
                )
              : 0
          }
        />
      )}

      {interviewerThinking && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`rounded-xl p-8 text-center border ${theme.cardBg}`}>
            <div className={`animate-pulse mb-2 ${theme.accent}`}>AI 面试官思考中...</div>
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {interviewerFeedback && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg ${
            isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
          }`}
        >
          {interviewerFeedback}
        </div>
      )}

      {showWrongAnswerBook && (
        <WrongAnswerBook
          wrongAnswers={wrongAnswers}
          onClose={() => setShowWrongAnswerBook(false)}
          onRemove={(id) => setWrongAnswers((p) => p.filter((x) => x.id !== id))}
        />
      )}

      {showFavorites && (
        <FavoritesBook
          favorites={favorites}
          onClose={() => setShowFavorites(false)}
          onRemove={(id) => setFavorites(removeFavoriteQuestion(id))}
        />
      )}

      {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} />}

      {showReport && (
        <InterviewerReport
          observations={observations}
          onClose={() => setShowReport(false)}
          sessionId={sessionId}
          userId={userId}
          position={currentPosition}
          qaList={sessionQaList}
          faceSummary={faceSummary}
          durationMinutes={
            interviewStartTime
              ? Math.max(1, Math.round((Date.now() - interviewStartTime) / 60000))
              : 5
          }
        />
      )}

      {showCelebration && (
        <CelebrationAnimation show={showCelebration} onComplete={() => setShowCelebration(false)} />
      )}
    </div>
  );
};

const FilterChip = ({ active, onClick, children, theme }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
      active ? theme.accentBg : theme.btnSecondary
    }`}
  >
    {children}
  </button>
);

const SideBtn = ({ icon: Icon, label, onClick, disabled, active, theme, isDark }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-40 border ${
      active
        ? isDark
          ? 'bg-blue-600/20 text-blue-400 border-blue-600/30'
          : 'bg-blue-50 text-blue-700 border-blue-200'
        : isDark
          ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-gray-800'
          : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" />
    {label}
  </button>
);

const AppHeader = ({ theme, isDark, toggleTheme, nickname, setNickname, onHistory }) => (
  <header className={`border-b backdrop-blur sticky top-0 z-40 ${theme.headerBg}`}>
    <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <UserNickname onNicknameChange={setNickname} />
        <div className="hidden sm:flex items-center gap-2">
          <span className={`text-2xl font-serif font-bold ${theme.brand}`}>镜面</span>
          <span className={`text-xs hidden md:inline ${theme.muted}`}>
            AI驱动的智能面试训练系统          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 rounded-lg ${theme.toggleBtn}`}
          title={isDark ? '切换白天模式' : '切换黑夜模式'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={onHistory}
          className={`p-2 rounded-lg ${theme.toggleBtn}`}
          title="历史记录"
        >
          <History className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
);

const PositionPicker = ({ onSelect, getPositionName, theme }) => (
  <div className="py-10">
    <h2 className={`text-2xl font-bold text-center mb-2 ${theme.pageText}`}>选择面试岗位</h2>
    <p className={`text-center text-sm mb-8 ${theme.muted}`}>应届生专属真题 · 每岗 60 道（六类题型）</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Object.keys(questionBank).map((position) => (
        <button
          key={position}
          type="button"
          onClick={() => onSelect(position)}
          className={`p-6 rounded-xl border text-left transition-all hover:scale-[1.02] ${theme.cardMuted}`}
        >
          <div className={`text-xl font-bold ${theme.brand}`}>{getPositionName(position)}</div>
          <div className={`text-sm mt-1 ${theme.muted}`}>{questionBank[position].length} 道题</div>
        </button>
      ))}
    </div>
  </div>
);

const RealPositionPicker = ({ onSelect, getPositionName, theme }) => (
  <div className="py-10">
    <h2 className={`text-2xl font-bold text-center mb-2 ${theme.pageText}`}>真实面试 · 选择岗位</h2>
    <p className={`text-center text-sm mb-8 ${theme.muted}`}>AI 将扮演该方向面试官与你对话</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Object.keys(questionBank).map((position) => (
        <button
          key={position}
          type="button"
          onClick={() => onSelect(position)}
          className={`p-6 rounded-xl border text-left ${theme.cardMuted}`}
        >
          <div className="text-xl font-bold text-emerald-600">{getPositionName(position)}</div>
        </button>
      ))}
    </div>
  </div>
);

export default Index;
