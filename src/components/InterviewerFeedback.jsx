import React from 'react';
import { CheckCircle, XCircle, Clock, Star, TrendingUp, MessageSquare, FileText } from 'lucide-react';

const InterviewerFeedback = ({ 
  timeUsed, 
  isUnderPressure,
  onContinue,
  userAnswer,
  keywords,
  question,
  position,
  aiAnalysis
}) => {
  const defaultAnalysis = {
    score: 50,
    lengthAnalysis: {
      quality: 'fair',
      feedback: '回答长度适中'
    },
    fluencyAnalysis: {
      fluency: 'fair',
      feedback: '语言表达流畅'
    },
    logicAnalysis: {
      logic: 'fair',
      feedback: '逻辑结构清晰'
    },
    contentAnalysis: {
      quality: 'fair',
      feedback: '内容丰富,有深度'
    },
    suggestions: [],
    detailedEvaluation: '嗯，继续努力吧。'
  };

  const analysis = aiAnalysis || defaultAnalysis;
  // 仅在后端明确降级时显示提示（避免误把 undefined 或顶层 fallback 字段当成降级）
  const isFallback =
    analysis.fallback === true && analysis.fromBackend !== true;

  const getFeedbackMessage = () => {
    if (analysis.score >= 80) {
      return {
        message: '嗯，回答得不错。',
        tone: '赞赏',
        color: 'text-green-400'
      };
    } else if (analysis.score >= 60) {
      return {
        message: '还行，不过还有改进空间。',
        tone: '鼓励',
        color: 'text-blue-400'
      };
    } else if (analysis.score >= 40) {
      return {
        message: '基本合格，但需要更深入地思考。',
        tone: '指导',
        color: 'text-yellow-400'
      };
    } else {
      return {
        message: '还有很大提升空间，多思考一下。',
        tone: '建议',
        color: 'text-red-400'
      };
    }
  };

  const feedback = getFeedbackMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            analysis.score >= 60 ? 'bg-green-900' : 'bg-red-900'
          }`}>
            {analysis.score >= 60 ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-white">面试官评价</h3>
          <p className={`text-sm font-medium mb-3 ${feedback.color}`}>
            [{feedback.tone}语气] {feedback.message}
          </p>
        </div>

        {isFallback && (
          <div className="mb-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-300">
              后端 AI 服务暂不可用，以下为本地规则评分结果。请确认后端已启动（http://localhost:5000）。
            </p>
          </div>
        )}

        {analysis.highlight && (
          <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
            <p className="text-sm text-green-300">
              <span className="font-medium">亮点：</span>
              {analysis.highlight}
            </p>
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center text-blue-300">
              <TrendingUp className="w-4 h-4 mr-1" />
              综合评分
            </span>
            <span className={`text-2xl font-bold ${feedback.color}`}>
              {analysis.score}/100
            </span>
          </div>
          <div className="w-full bg-blue-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                analysis.score >= 80 ? 'bg-green-500' :
                analysis.score >= 60 ? 'bg-blue-500' :
                analysis.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${analysis.score}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <span className="text-sm font-medium flex items-center text-gray-300">
              <Clock className="w-4 h-4 mr-1" />
              用时
            </span>
            <span className="font-bold text-gray-200">{timeUsed}秒</span>
          </div>

          {isUnderPressure && (
            <div className="flex items-center justify-between p-3 bg-orange-900 rounded-lg">
              <span className="text-sm font-medium flex items-center text-orange-300">
                <Star className="w-4 h-4 mr-1" />
                压力模式
              </span>
              <span className="font-bold text-orange-400">已激活</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3 flex items-center text-white">
            <FileText className="w-5 h-5 mr-2 text-blue-400" />
            面试官评价
          </h4>
          <div className="p-4 bg-blue-900 rounded-lg">
            <p className="text-sm text-gray-300 leading-relaxed">
              {analysis.detailedEvaluation}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-medium mb-3 flex items-center text-white">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
            详细分析
          </h4>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-300">回答长度</span>
                <span className={`text-sm ${
                  analysis.lengthAnalysis?.quality === 'good' ? 'text-green-400' :
                  analysis.lengthAnalysis?.quality === 'fair' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analysis.lengthAnalysis?.quality === 'good' ? '良好' :
                   analysis.lengthAnalysis?.quality === 'fair' ? '一般' : '需改进'}
                </span>
              </div>
              <p className="text-xs text-gray-400">{analysis.lengthAnalysis?.feedback || '暂无反馈'}</p>
            </div>

            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-300">语言流畅度</span>
                <span className={`text-sm ${
                  analysis.fluencyAnalysis?.fluency === 'good' ? 'text-green-400' :
                  analysis.fluencyAnalysis?.fluency === 'fair' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analysis.fluencyAnalysis?.fluency === 'good' ? '良好' :
                   analysis.fluencyAnalysis?.fluency === 'fair' ? '一般' : '需改进'}
                </span>
              </div>
              <p className="text-xs text-gray-400">{analysis.fluencyAnalysis?.feedback || '暂无反馈'}</p>
            </div>

            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-300">逻辑结构</span>
                <span className={`text-sm ${
                  analysis.logicAnalysis?.logic === 'good' ? 'text-green-400' :
                  analysis.logicAnalysis?.logic === 'fair' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analysis.logicAnalysis?.logic === 'good' ? '良好' :
                   analysis.logicAnalysis?.logic === 'fair' ? '一般' : '需改进'}
                </span>
              </div>
              <p className="text-xs text-gray-400">{analysis.logicAnalysis?.feedback || '暂无反馈'}</p>
            </div>

            <div className="p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-300">内容质量</span>
                <span className={`text-sm ${
                  analysis.contentAnalysis?.quality === 'good' ? 'text-green-400' :
                  analysis.contentAnalysis?.quality === 'fair' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analysis.contentAnalysis?.quality === 'good' ? '良好' :
                   analysis.contentAnalysis?.quality === 'fair' ? '一般' : '需改进'}
                </span>
              </div>
              <p className="text-xs text-gray-400">{analysis.contentAnalysis?.feedback || '暂无反馈'}</p>
            </div>
          </div>
        </div>

        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-red-400">改进建议</h4>
            <div className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  suggestion.priority === 'high' ? 'bg-red-900 border border-red-700' :
                  suggestion.priority === 'medium' ? 'bg-yellow-900 border border-yellow-700' :
                  'bg-blue-900 border border-blue-700'
                }`}>
                  <p className="text-sm text-gray-300">{suggestion.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full bg-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-800 transition-colors"
        >
          继续面试
        </button>
      </div>
    </div>
  );
};

export default InterviewerFeedback;
