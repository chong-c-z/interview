import { scoreAnswer, mapPositionToJobType } from '../services/backendApi';

const qualityFromScore = (score) => {
  if (score >= 20) return 'good';
  if (score >= 15) return 'fair';
  return 'poor';
};

const feedbackFromQuality = (quality, goodText, fairText, poorText) => {
  if (quality === 'good') return goodText;
  if (quality === 'fair') return fairText;
  return poorText;
};

/** 将后端 /score-answer 响应映射为 UI 使用的分析结构 */
export const mapBackendScoreToAnalysis = (apiResult) => {
  const score = apiResult.total_score ?? 0;
  const dims = apiResult.dimensions || {};

  const contentScore = dims.content ?? 0;
  const logicScore = dims.logic ?? 0;
  const specificScore = dims.specific ?? 0;
  const matchScore = dims.match ?? 0;

  const contentQuality = qualityFromScore(contentScore);
  const logicQuality = qualityFromScore(logicScore);
  const specificQuality = qualityFromScore(specificScore);
  const matchQuality = qualityFromScore(matchScore);

  const improvements = Array.isArray(apiResult.improvements)
    ? apiResult.improvements
    : [];

  return {
    score,
    fromBackend: true,
    fallback: false,
    dimensions: {
      content: contentScore,
      logic: logicScore,
      specific: specificScore,
      match: matchScore,
    },
    highlight: apiResult.highlight || '',
    lengthAnalysis: {
      quality: specificQuality,
      feedback: feedbackFromQuality(
        specificQuality,
        '回答有具体案例与细节',
        '可以再补充一些具体例子',
        '建议增加具体案例、数据或细节'
      ),
      wordCount: 0,
      charCount: 0,
    },
    fluencyAnalysis: {
      fluency: matchQuality,
      feedback: feedbackFromQuality(
        matchQuality,
        '表达与岗位匹配度较好',
        '可以进一步体现岗位相关能力',
        '建议结合岗位特点组织回答'
      ),
      sentenceCount: 0,
      avgSentenceLength: 0,
    },
    logicAnalysis: {
      logic: logicQuality,
      feedback: feedbackFromQuality(
        logicQuality,
        '逻辑结构清晰有条理',
        '逻辑基本清楚，可再强化层次',
        '建议使用「首先、其次」等结构词增强条理'
      ),
      logicWords: [],
      logicWordCount: 0,
    },
    contentAnalysis: {
      quality: contentQuality,
      feedback: feedbackFromQuality(
        contentQuality,
        '内容完整，覆盖了题目要点',
        '内容尚可，可再覆盖更多要点',
        '内容完整性不足，请围绕题目核心展开'
      ),
      hasExample: specificScore >= 18,
      hasData: specificScore >= 20,
      hasReflection: logicScore >= 18,
      hasAction: matchScore >= 18,
    },
    suggestions: improvements.map((message, index) => ({
      type: 'content',
      priority: index === 0 ? 'high' : 'medium',
      message: typeof message === 'string' ? message : String(message),
    })),
    detailedEvaluation:
      apiResult.interviewer_comment ||
      '感谢你的回答，请根据建议继续练习。',
  };
};

// ---------- 本地降级评分（后端不可用时） ----------

const simulateAIAnalysis = (answer, keywords, question, position) => {
  const lengthAnalysis = analyzeAnswerLength(answer);
  const fluencyAnalysis = analyzeFluency(answer);
  const logicAnalysis = analyzeLogic(answer);
  const contentAnalysis = analyzeContentQuality(answer, question, position);

  const overallScore = calculateOverallScore({
    lengthAnalysis,
    fluencyAnalysis,
    logicAnalysis,
    contentAnalysis,
  });

  const suggestions = generateSuggestions({
    lengthAnalysis,
    fluencyAnalysis,
    logicAnalysis,
    contentAnalysis,
    overallScore,
    question,
    position,
  });

  const detailedEvaluation = generateDetailedEvaluation(
    answer,
    question,
    position,
    overallScore
  );

  return {
    score: overallScore,
    fromBackend: false,
    fallback: true,
    dimensions: {
      content: Math.round(overallScore * 0.25),
      logic: Math.round(overallScore * 0.25),
      specific: Math.round(overallScore * 0.25),
      match: Math.round(overallScore * 0.25),
    },
    lengthAnalysis,
    fluencyAnalysis,
    logicAnalysis,
    contentAnalysis,
    suggestions,
    detailedEvaluation,
  };
};

export const analyzeAnswerWithAI = async (
  answer,
  keywords,
  question,
  position
) => {
  try {
    const apiResult = await scoreAnswer({
      question,
      answer,
      job_type: mapPositionToJobType(position),
    });
    return mapBackendScoreToAnalysis(apiResult);
  } catch (error) {
    console.warn('后端 AI 评分不可用，使用本地降级评分:', error.message);
    return simulateAIAnalysis(answer, keywords, question, position);
  }
};

const analyzeAnswerLength = (answer) => {
  const wordCount = answer.trim().split(/\s+/).length;
  const charCount = answer.length;

  let quality = 'good';
  let feedback = '回答长度适中';

  if (wordCount < 50) {
    quality = 'poor';
    feedback = '回答过于简短，建议展开更多细节';
  } else if (wordCount > 300) {
    quality = 'fair';
    feedback = '回答较长，注意保持重点突出';
  }

  return { wordCount, charCount, quality, feedback };
};

const analyzeFluency = (answer) => {
  const sentences = answer.split(/[。！？.!?]/).filter((s) => s.trim());
  const avgSentenceLength =
    sentences.length > 0 ? answer.length / sentences.length : 0;

  let fluency = 'good';
  let feedback = '语言表达流畅';

  if (avgSentenceLength < 10) {
    fluency = 'poor';
    feedback = '句子过短，建议使用更完整的表达';
  } else if (avgSentenceLength > 50) {
    fluency = 'fair';
    feedback = '句子较长，注意适当断句';
  }

  return {
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength),
    fluency,
    feedback,
  };
};

const analyzeLogic = (answer) => {
  const logicWords = [
    '首先',
    '其次',
    '然后',
    '最后',
    '因此',
    '所以',
    '但是',
    '然而',
    '同时',
    '另外',
  ];
  const foundLogicWords = logicWords.filter((word) => answer.includes(word));

  let logic = 'good';
  let feedback = '逻辑结构清晰';

  if (foundLogicWords.length < 2) {
    logic = 'fair';
    feedback = '建议增加逻辑连接词，使回答更有条理';
  }

  return {
    logicWords: foundLogicWords,
    logicWordCount: foundLogicWords.length,
    logic,
    feedback,
  };
};

const analyzeContentQuality = (answer, question, position) => {
  const lowerAnswer = answer.toLowerCase();
  const hasExample = /例如|比如|举例|案例|经历|项目|实践|做过|负责|参与/.test(
    lowerAnswer
  );
  const hasData = /\d+%|\d+个|\d+年|\d+月|\d+天|提升|增长|减少|优化|改进|效果|结果/.test(
    lowerAnswer
  );
  const hasReflection = /总结|反思|收获|成长|学习|改进|优化|提升|经验|教训/.test(
    lowerAnswer
  );
  const hasAction = /会|将|可以|能够|计划|打算|准备|实施|执行|推进|落实/.test(
    lowerAnswer
  );

  let quality = 'good';
  let feedback = '内容丰富，有深度';

  const scorePoints = [hasExample, hasData, hasReflection, hasAction].filter(
    Boolean
  ).length;

  if (scorePoints < 2) {
    quality = 'poor';
    feedback = '回答较为空泛，建议增加具体例子、数据支撑或反思总结';
  } else if (scorePoints < 3) {
    quality = 'fair';
    feedback = '回答有一定内容，但可以更具体、更有深度';
  }

  return {
    hasExample,
    hasData,
    hasReflection,
    hasAction,
    quality,
    feedback,
  };
};

const calculateOverallScore = (analysis) => {
  const weights = { length: 0.2, fluency: 0.2, logic: 0.2, content: 0.4 };

  const lengthScore =
    analysis.lengthAnalysis.quality === 'good'
      ? 100
      : analysis.lengthAnalysis.quality === 'fair'
        ? 70
        : 40;
  const fluencyScore =
    analysis.fluencyAnalysis.fluency === 'good'
      ? 100
      : analysis.fluencyAnalysis.fluency === 'fair'
        ? 70
        : 40;
  const logicScore =
    analysis.logicAnalysis.logic === 'good'
      ? 100
      : analysis.logicAnalysis.logic === 'fair'
        ? 70
        : 40;
  const contentScore =
    analysis.contentAnalysis.quality === 'good'
      ? 100
      : analysis.contentAnalysis.quality === 'fair'
        ? 70
        : 40;

  const overallScore = Math.round(
    lengthScore * weights.length +
      fluencyScore * weights.fluency +
      logicScore * weights.logic +
      contentScore * weights.content
  );

  return Math.min(100, Math.max(0, overallScore));
};

const generateSuggestions = (analysis) => {
  const suggestions = [];

  if (analysis.lengthAnalysis.quality !== 'good') {
    suggestions.push({
      type: 'length',
      priority: analysis.lengthAnalysis.quality === 'fair' ? 'medium' : 'high',
      message: analysis.lengthAnalysis.feedback,
    });
  }

  if (analysis.fluencyAnalysis.fluency !== 'good') {
    suggestions.push({
      type: 'fluency',
      priority: analysis.fluencyAnalysis.fluency === 'fair' ? 'medium' : 'high',
      message: analysis.fluencyAnalysis.feedback,
    });
  }

  if (analysis.logicAnalysis.logic !== 'good') {
    suggestions.push({
      type: 'logic',
      priority: analysis.logicAnalysis.logic === 'fair' ? 'medium' : 'high',
      message: analysis.logicAnalysis.feedback,
    });
  }

  if (analysis.contentAnalysis.quality !== 'good') {
    suggestions.push({
      type: 'content',
      priority: analysis.contentAnalysis.quality === 'fair' ? 'medium' : 'high',
      message: analysis.contentAnalysis.feedback,
    });
  }

  if (!analysis.contentAnalysis.hasExample) {
    suggestions.push({
      type: 'example',
      priority: 'high',
      message: '建议增加具体的工作案例或项目经历来支撑你的观点',
    });
  }

  return suggestions;
};

const generateDetailedEvaluation = (answer, question, position, score) => {
  const positionEvaluations = {
    product: {
      high: '嗯，作为产品经理，你的回答展现了出色的产品思维和用户洞察力。',
      medium: '作为产品经理，你的回答基本合格，但还可以更深入地结合案例说明。',
      low: '作为产品经理，建议多从用户角度出发，用具体案例支撑观点。',
    },
    frontend: {
      high: '嗯，作为前端工程师，你的回答展现了扎实的技术功底和工程思维。',
      medium: '作为前端工程师，你的回答基本合格，建议多结合技术实现细节。',
      low: '作为前端工程师，建议用具体项目经验和技术细节来支撑回答。',
    },
    operation: {
      high: '嗯，作为运营人员，你的回答展现了出色的运营思维和数据分析能力。',
      medium: '作为运营人员，你的回答基本合格，建议多结合运营案例和数据。',
      low: '作为运营人员，建议从业务角度出发，用案例和数据支撑观点。',
    },
  };

  const evaluation = positionEvaluations[position] || positionEvaluations.product;

  if (score >= 80) return evaluation.high;
  if (score >= 60) return evaluation.medium;
  return evaluation.low;
};
