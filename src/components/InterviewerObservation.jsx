import React, { useState, useEffect, useRef } from 'react';
import { Eye, Smile, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { saveInterviewObservation } from '../utils/database';

const InterviewerObservation = ({
  detection,
  isActive,
  onObservation,
  sessionId,
  userId,
  focusDurationText = '0分0秒',
  lowHeadCount = 0,
  sessionAnswerCount = 0,
}) => {
  const [observations, setObservations] = useState([]);
  const lastHeadDownRef = useRef(0);

  useEffect(() => {
    if (!isActive || !detection) return;

    const newObservations = [];
    const timestamp = new Date().toLocaleTimeString();

    if (detection.headDown || detection.headPose === 'forward') {
      const now = Date.now();
      if (now - lastHeadDownRef.current > 2500) {
        lastHeadDownRef.current = now;
        const observation = {
          id: Date.now() + Math.random(),
          type: 'head_pose',
          message: '面试官注意到你低头了，请保持平视',
          timestamp,
          severity: 'warning',
        };
        newObservations.push(observation);
        saveInterviewObservation({
          userId,
          sessionId,
          observationType: 'head_pose',
          observationValue: 'head_down',
          message: observation.message,
          severity: 'warning',
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (detection.fromBackend && detection.comment) {
      const isPositive =
        detection.expression === 'smile' ||
        detection.emotionCn === '微笑' ||
        detection.emotionCn === '平静';
      if (detection.emotionChanged !== false) {
        newObservations.push({
          id: Date.now() + Math.random(),
          type: 'expression',
          message: detection.comment,
          timestamp,
          severity: isPositive ? 'positive' : 'warning',
        });
      }
    }

    if (newObservations.length > 0) {
      setObservations((prev) => [...newObservations, ...prev].slice(0, 30));
    }
  }, [detection, isActive, sessionId, userId]);

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'positive':
        return 'text-emerald-400 bg-emerald-900/20 border-emerald-800/50';
      case 'warning':
        return 'text-amber-400 bg-amber-900/20 border-amber-800/50';
      default:
        return 'text-gray-400 bg-gray-800/50 border-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[200px] p-3">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          面试官观察
        </h3>
        <span className="flex items-center text-[10px] text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
        {observations.length === 0 ? (
          <div className="text-center py-6 text-gray-600 text-sm">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
            等待观察数据...
          </div>
        ) : (
          observations.map((obs) => (
            <div
              key={obs.id}
              className={`p-2.5 rounded-lg border text-xs ${getSeverityStyle(obs.severity)}`}
            >
              <p className="font-medium leading-snug">{obs.message}</p>
              <p className="text-[10px] opacity-60 mt-1">{obs.timestamp}</p>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 pt-2 border-t border-gray-800">
        <h4 className="text-[10px] text-gray-600 uppercase mb-2">行为统计</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-[#0a0e17] border border-gray-800">
            <div className="text-sm font-bold text-gray-200">{lowHeadCount}</div>
            <div className="text-[10px] text-gray-500">低头次数</div>
          </div>
          <div className="p-2 rounded-lg bg-[#0a0e17] border border-gray-800">
            <div className="text-xs font-bold text-amber-400 leading-tight">{focusDurationText}</div>
            <div className="text-[10px] text-gray-500">专注时长</div>
          </div>
          <div className="p-2 rounded-lg bg-[#0a0e17] border border-gray-800">
            <div className="text-sm font-bold text-gray-200">{sessionAnswerCount}</div>
            <div className="text-[10px] text-gray-500">已答题数</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerObservation;