import React, { useState, useEffect } from 'react';
import { FileText, Star, TrendingUp, User, Eye, Smile, Loader2 } from 'lucide-react';
import { getInterviewObservations, endInterviewSession } from '../utils/database';
import { generateReport, mapPositionToJobType } from '../services/backendApi';

const InterviewerReport = ({
  observations,
  onClose,
  sessionId,
  userId,
  position = 'product',
  qaList = [],
  faceSummary = {},
  durationMinutes = 5,
}) => {
  const [dbObservations, setDbObservations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFromBackend, setReportFromBackend] = useState(false);

  useEffect(() => {
    const fetchObservations = async () => {
      if (userId && sessionId) {
        const data = await getInterviewObservations(userId, sessionId);
        setDbObservations(data);
      }
    };
    fetchObservations();
  }, [userId, sessionId]);

  useEffect(() => {
    const fetchAiReport = async () => {
      if (!qaList || qaList.length === 0) return;

      setReportLoading(true);
      try {
        const result = await generateReport({
          job_type: mapPositionToJobType(position),
          qa_list: qaList,
          face_summary: faceSummary,
          duration: durationMinutes,
        });
        setAiReport(result);
        setReportFromBackend(true);
      } catch (error) {
        console.warn('综合报告生成失败，使用本地计算:', error.message);
        setReportFromBackend(false);
      } finally {
        setReportLoading(false);
      }
    };

    fetchAiReport();
  }, [qaList, faceSummary, position, durationMinutes]);

  const calculatePostureScore = () => {
    const headPoseObservations = [...observations, ...dbObservations].filter(
      (obs) => obs.type === 'head_pose' || obs.observation_type === 'head_pose'
    );
    const lowHeadCount = headPoseObservations.filter(
      (obs) =>
        obs.message?.includes('低头') || obs.message?.includes('forward')
    ).length;
    const tiltedCount = headPoseObservations.filter(
      (obs) =>
        obs.message?.includes('倾斜') || obs.message?.includes('tilted')
    ).length;

    let score = 100;
    score -= lowHeadCount * 15;
    score += tiltedCount * 5;

    return Math.max(0, Math.min(100, score));
  };

  const calculateExpressionScore = () => {
    const expressionObservations = [...observations, ...dbObservations].filter(
      (obs) => obs.type === 'expression' || obs.observation_type === 'expression'
    );
    const smileCount = expressionObservations.filter(
      (obs) =>
        obs.message?.includes('微笑') || obs.message?.includes('smile')
    ).length;
    const frownCount = expressionObservations.filter(
      (obs) =>
        obs.message?.includes('皱眉') ||
        obs.message?.includes('frown') ||
        obs.message?.includes('紧张')
    ).length;

    let score = 70;
    score += smileCount * 10;
    score -= frownCount * 15;

    if (faceSummary?.score_bonus) {
      score += faceSummary.score_bonus;
    }

    return Math.max(0, Math.min(100, score));
  };

  const calculateEyeContactScore = () => {
    const eyeObservations = [...observations, ...dbObservations].filter(
      (obs) => obs.type === 'eye_contact' || obs.observation_type === 'eye_contact'
    );
    const poorContactCount = eyeObservations.filter(
      (obs) =>
        obs.message?.includes('飘忽') ||
        obs.message?.includes('left') ||
        obs.message?.includes('right')
    ).length;

    let score = 100;
    score -= poorContactCount * 20;

    return Math.max(0, Math.min(100, score));
  };

  const calculateOverallImpression = () => {
    const postureScore = calculatePostureScore();
    const expressionScore = calculateExpressionScore();
    const eyeContactScore = calculateEyeContactScore();

    const overallScore = (postureScore + expressionScore + eyeContactScore) / 3;

    if (overallScore >= 85) {
      return {
        score: overallScore,
        level: '优秀',
        description: '面试官对你的整体印象非常好，表现自然自信',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    }
    if (overallScore >= 70) {
      return {
        score: overallScore,
        level: '良好',
        description: '面试官对你的印象不错，整体表现令人满意',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    }
    if (overallScore >= 55) {
      return {
        score: overallScore,
        level: '一般',
        description: '面试官认为你有改进空间，需要注意细节表现',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      };
    }
    return {
      score: overallScore,
      level: '需改进',
      description: '面试官对你的印象一般，建议多练习面试技巧',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    };
  };

  const postureScore = calculatePostureScore();
  const expressionScore = calculateExpressionScore();
  const eyeContactScore = calculateEyeContactScore();
  const overallImpression = calculateOverallImpression();

  const displayScore = aiReport?.overall_score ?? overallImpression.score;
  const displayLevel = aiReport?.rank ?? overallImpression.level;
  const displaySummary = aiReport?.summary ?? overallImpression.description;

  const handleClose = async () => {
    if (userId && sessionId) {
      setIsSaving(true);
      await endInterviewSession(sessionId, {
        postureScore,
        expressionScore,
        eyeContactScore,
        overallImpression: displaySummary,
      });
      setIsSaving(false);
    }
    onClose();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-800">面试官观察报告</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
              disabled={isSaving}
            >
              ×
            </button>
          </div>

          {reportLoading && (
            <div className="flex items-center justify-center py-4 text-blue-600 mb-4">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">正在生成 AI 综合报告...</span>
            </div>
          )}

          {reportFromBackend && aiReport && (
            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              已由后端 AI 生成综合评估报告
            </div>
          )}

          <div
            className={`p-4 rounded-lg ${overallImpression.bgColor} mb-6`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">综合印象</h3>
              <div
                className={`text-2xl font-bold ${getScoreColor(displayScore)}`}
              >
                {Math.round(displayScore)}分
              </div>
            </div>
            <div className="flex items-center mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${overallImpression.color} ${overallImpression.bgColor}`}
              >
                {displayLevel}
              </span>
            </div>
            <p className="text-gray-700">{displaySummary}</p>
          </div>

          {aiReport && (
            <div className="space-y-4 mb-6">
              {aiReport.strengths?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">优势</h4>
                  <ul className="space-y-1">
                    {aiReport.strengths.map((item, i) => (
                      <li key={i} className="text-sm text-green-700">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiReport.weaknesses?.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 mb-2">不足</h4>
                  <ul className="space-y-1">
                    {aiReport.weaknesses.map((item, i) => (
                      <li key={i} className="text-sm text-orange-700">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiReport.next_steps?.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">下一步建议</h4>
                  <ul className="space-y-1">
                    {aiReport.next_steps.map((item, i) => (
                      <li key={i} className="text-sm text-blue-700">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiReport.hiring_tendency && (
                <p className="text-sm text-gray-600 text-center">
                  录用倾向：{aiReport.hiring_tendency}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">体态评分</h4>
                </div>
                <span
                  className={`text-xl font-bold ${getScoreColor(postureScore)}`}
                >
                  {postureScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(postureScore)}`}
                  style={{ width: `${postureScore}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Smile className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">表达评分</h4>
                </div>
                <span
                  className={`text-xl font-bold ${getScoreColor(expressionScore)}`}
                >
                  {expressionScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(expressionScore)}`}
                  style={{ width: `${expressionScore}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-gray-600 mr-2" />
                  <h4 className="font-semibold text-gray-800">眼神交流</h4>
                </div>
                <span
                  className={`text-xl font-bold ${getScoreColor(eyeContactScore)}`}
                >
                  {eyeContactScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreBgColor(eyeContactScore)}`}
                  style={{ width: `${eyeContactScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              改进建议
            </h4>
            <div className="space-y-2">
              {postureScore < 70 && (
                <p className="text-sm text-gray-700">
                  • 保持头部直立，避免频繁低头，展现自信姿态
                </p>
              )}
              {expressionScore < 70 && (
                <p className="text-sm text-gray-700">
                  • 多微笑，展现亲和力和积极态度
                </p>
              )}
              {eyeContactScore < 70 && (
                <p className="text-sm text-gray-700">
                  • 保持眼神交流，展现专注和诚意
                </p>
              )}
              {displayScore >= 80 && (
                <p className="text-sm text-gray-700">
                  • 继续保持优秀的表现，你做得很好！
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '关闭报告'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerReport;
