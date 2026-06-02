import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, MessageSquare, Eye, Smile, User } from 'lucide-react';
import { aiScoringService } from '../services/aiScoringService';

const ComprehensiveScoring = ({ 
  userAnswer, 
  question, 
  position, 
  keywords, 
  expressionScore, 
  eyeContactScore, 
  postureScore,
  onScoreComplete 
}) => {
  const [isScoring, setIsScoring] = useState(false);
  const [aiScore, setAiScore] = useState(null);
  const [overallScore, setOverallScore] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userAnswer && question && position) {
      performComprehensiveScoring();
    }
  }, [userAnswer, question, position, expressionScore, eyeContactScore, postureScore]);

  const performComprehensiveScoring = async () => {
    setIsScoring(true);
    setError(null);

    try {
      // 调用AI进行语言内容评分
      const aiResult = await aiScoringService.scoreInterview({
        answer: userAnswer,
        question: question,
        position: position,
        keywords: keywords
      });

      setAiScore(aiResult);

      if (aiResult.fallback) {
        setError('AI 评分服务暂时不可用，将使用基础评分');
      }

      // 计算综合评分
      const contentScore = aiResult.score;
      const finalScore = calculateOverallScore({
        contentScore,
        expressionScore: expressionScore || 70,
        eyeContactScore: eyeContactScore || 70,
        postureScore: postureScore || 70
      });

      setOverallScore(finalScore);

      // 通知父组件评分完�?      if (onScoreComplete) {
        onScoreComplete({
          aiScore: aiResult,
          overallScore: finalScore,
          breakdown: {
            content: contentScore,
            expression: expressionScore || 70,
            eyeContact: eyeContactScore || 70,
            posture: postureScore || 70
          }
        });
      }
    } catch (error) {
      console.error('综合评分失败:', error);
      setError('评分服务异常，将使用基础评分');
      
      // 使用基础评分
      const basicScore = calculateBasicScore();
      setOverallScore(basicScore);
      
      if (onScoreComplete) {
        onScoreComplete({
          aiScore: null,
          overallScore: basicScore,
          breakdown: {
            content: basicScore,
            expression: expressionScore || 70,
            eyeContact: eyeContactScore || 70,
            posture: postureScore || 70
          }
        });
      }
    } finally {
      setIsScoring(false);
    }
  };

  const calculateOverallScore = ({ contentScore, expressionScore, eyeContactScore, postureScore }) => {
    // 权重分配
    const weights = {
      content: 0.5,      // 内容质量 50%
      expression: 0.2,   // 表情 20%
      eyeContact: 0.15,  // 眼神交流 15%
      posture: 0.15      // 姿�?15%
    };

    const weightedScore = 
      contentScore * weights.content +
      expressionScore * weights.expression +
      eyeContactScore * weights.eyeContact +
      postureScore * weights.posture;

    return Math.round(weightedScore);
  };

  const calculateBasicScore = () => {
    // 基础评分逻辑
    let score = 60; // 基础�?
    // 根据回答长度调整
    const wordCount = userAnswer.trim().split(/\s+/).length;
    if (wordCount > 100) score += 10;
    else if (wordCount > 50) score += 5;

    // 根据关键词匹配调�?    const matchedKeywords = keywords.filter(keyword => 
      userAnswer.toLowerCase().includes(keyword.toLowerCase())
    );
    score += (matchedKeywords.length / keywords.length) * 20;

    // 结合面部表情评分
    if (expressionScore) {
      score = (score + expressionScore) / 2;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLevel = (score) => {
    if (score >= 85) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 55) return '一�?;
    return '需改进';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Star className="w-6 h-6 text-yellow-500 mr-2" />
          综合评分
        </h3>
        {isScoring && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            AI评分�?..
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 总体评分 */}
      <div className="mb-6 text-center">
        <div className={`text-4xl font-bold ${getScoreColor(overallScore)} mb-2`}>
          {overallScore}
        </div>
        <div className="text-lg font-medium text-gray-600">
          {getScoreLevel(overallScore)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
          <div
            className={`h-3 rounded-full ${getScoreBgColor(overallScore)} transition-all duration-500`}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* 分项评分 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-700">内容质量</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(aiScore?.score || overallScore)}`}>
              {aiScore?.score || Math.round(overallScore * 0.5)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBgColor(aiScore?.score || overallScore)}`}
              style={{ width: `${aiScore?.score || Math.round(overallScore * 0.5)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Smile className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-gray-700">表情</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(expressionScore || 70)}`}>
              {expressionScore || 70}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBgColor(expressionScore || 70)}`}
              style={{ width: `${expressionScore || 70}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-medium text-gray-700">眼神交流</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(eyeContactScore || 70)}`}>
              {eyeContactScore || 70}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBgColor(eyeContactScore || 70)}`}
              style={{ width: `${eyeContactScore || 70}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <User className="w-5 h-5 text-orange-600 mr-2" />
              <span className="font-medium text-gray-700">姿�?/span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(postureScore || 70)}`}>
              {postureScore || 70}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getScoreBgColor(postureScore || 70)}`}
              style={{ width: `${postureScore || 70}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI详细反馈 */}
      {aiScore && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">AI综合评价</h4>
            <p className="text-blue-700 text-sm">{aiScore.overallFeedback}</p>
          </div>

          {aiScore.suggestions && aiScore.suggestions.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">改进建议</h4>
              <ul className="space-y-1">
                {aiScore.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-green-700 text-sm flex items-start">
                    <span className="text-green-600 mr-2">�?/span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 各维度详细评�?*/}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">各维度详细评�?/h4>
            <div className="space-y-3">
              {aiScore.dimensions && Object.entries(aiScore.dimensions).map(([key, dimension]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key === 'content' ? '内容完整�? :
                     key === 'logic' ? '逻辑清晰�? :
                     key === 'professional' ? '专业深度' :
                     key === 'fluency' ? '表达流畅�? : key}
                  </span>
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${getScoreColor(dimension.score)} mr-2`}>
                      {dimension.score}/25
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreBgColor(dimension.score)}`}
                        style={{ width: `${(dimension.score / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveScoring;
