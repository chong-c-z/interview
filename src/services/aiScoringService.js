import {
  scoreAnswer,
  mapPositionToJobType,
} from './backendApi';
import { mapBackendScoreToAnalysis } from '../utils/aiAnalysis';

const calculateBasicScore = (answer, keywords = [], expressionScore = 70) => {
  let score = 60;

  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount > 100) score += 10;
  else if (wordCount > 50) score += 5;

  if (keywords.length > 0) {
    const matchedKeywords = keywords.filter((keyword) =>
      answer.toLowerCase().includes(keyword.toLowerCase())
    );
    score += (matchedKeywords.length / keywords.length) * 20;
  }

  if (expressionScore) {
    score = (score + expressionScore) / 2;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
};

export const aiScoringService = {
  /**
   * 调用本地后端进行面试评分
   */
  async scoreInterview({ answer, question, position, keywords }) {
    try {
      const apiResult = await scoreAnswer({
        question,
        answer,
        job_type: mapPositionToJobType(position),
      });

      const mapped = mapBackendScoreToAnalysis(apiResult);

      return {
        score: mapped.score,
        overallFeedback: mapped.detailedEvaluation,
        suggestions: mapped.suggestions.map((s) => s.message),
        highlight: mapped.highlight,
        dimensions: apiResult.dimensions
          ? {
              content: {
                score: apiResult.dimensions.content ?? 0,
                feedback: mapped.contentAnalysis.feedback,
              },
              logic: {
                score: apiResult.dimensions.logic ?? 0,
                feedback: mapped.logicAnalysis.feedback,
              },
              professional: {
                score: apiResult.dimensions.specific ?? 0,
                feedback: mapped.lengthAnalysis.feedback,
              },
              fluency: {
                score: apiResult.dimensions.match ?? 0,
                feedback: mapped.fluencyAnalysis.feedback,
              },
            }
          : null,
        fromBackend: true,
        fallback: false,
      };
    } catch (error) {
      console.warn('综合评分后端不可用，使用本地基础评分:', error.message);

      const basicScore = calculateBasicScore(answer, keywords, 70);

      return {
        score: basicScore,
        overallFeedback:
          'AI 评分服务暂时不可用，已使用本地基础规则评分，请稍后重试�?,
        suggestions: ['确保后端服务已启动（https://interview-3mns.onrender.com�?],
        dimensions: null,
        fromBackend: false,
        fallback: true,
      };
    }
  },

  getSupportedProviders() {
    return ['local-backend'];
  },

  async testConnection() {
    try {
      await scoreAnswer({
        question: '请介绍一下你自己',
        answer: '这是一个测试回�?,
        job_type: '产品',
      });
      return true;
    } catch {
      return false;
    }
  },
};
