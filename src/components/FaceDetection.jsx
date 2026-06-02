import React, { useEffect, useRef, useState, useCallback } from 'react';
import { analyzeVideoFrame, loadFaceApiModels } from '../utils/faceApiLoader';
import { useTheme } from '../contexts/ThemeContext';

const DETECT_INTERVAL_MS = 2000;

// 低头防抖：连续检测到低头超过此毫秒数才算一次
const HEAD_DOWN_CONFIRM_MS = 1000;

const FaceDetection = ({
  onDetectionUpdate,
  isActive,
  onExpressionScore,
  onEyeContactScore,
  onPostureScore,
  onFaceSummaryUpdate,
}) => {
  const { theme } = useTheme();
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const lastReportedEmotionRef = useRef(null);

  // 低头防抖状态
  const headDownStartRef = useRef(null);   // 开始低头的时间戳
  const headDownCountedRef = useRef(false); // 本次低头是否已经计数
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [error, setError] = useState(null);
  const [lastEmotion, setLastEmotion] = useState(null);
  const [expressionHistory, setExpressionHistory] = useState([]);
  const [bonusHistory, setBonusHistory] = useState([]);

  useEffect(() => {
    loadFaceApiModels()
      .then(() => setModelsReady(true))
      .catch((e) => {
        console.error('face-api 模型加载失败', e);
        setError('表情识别模型加载失败');
      });
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
          setIsCameraReady(true);
        };
      }
    } catch (err) {
      console.error('摄像头访问失败', err);
      setError('无法访问摄像头，请检查权限');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, []);

  const runDetection = useCallback(async () => {
    if (!modelsReady || isAnalyzingRef.current || !videoRef.current) return;
    if (videoRef.current.readyState < 2) return;

    isAnalyzingRef.current = true;
    try {
      const detection = await analyzeVideoFrame(videoRef.current);
      setLastEmotion(detection.emotionCn);

      // 低头防抖逻辑：
      // - 开始低头：记录时间戳，不立即计数
      // - 持续低头超过 HEAD_DOWN_CONFIRM_MS 计为一次，标记已计数
      // - 抬头时清空状态，下次低头才能再计数
      let shouldReportHeadDown = false;

      if (detection.headDown) {
        if (headDownStartRef.current === null) {
          headDownStartRef.current = Date.now();
          headDownCountedRef.current = false;
        } else if (
          !headDownCountedRef.current &&
          Date.now() - headDownStartRef.current >= HEAD_DOWN_CONFIRM_MS
        ) {
          headDownCountedRef.current = true;
          shouldReportHeadDown = true;
        }
      } else {
        // 抬头了，重置状态
        headDownStartRef.current = null;
        headDownCountedRef.current = false;
      }

      const emotionChanged = lastReportedEmotionRef.current !== detection.emotionCn;
      if (emotionChanged || shouldReportHeadDown) {
        if (emotionChanged) lastReportedEmotionRef.current = detection.emotionCn;
        onDetectionUpdate?.({
          ...detection,
          emotionChanged,
          headDown: shouldReportHeadDown,
        });
      }

      setExpressionHistory((prev) =>
        [...prev, { expression: detection.expression, timestamp: Date.now() }].slice(-100)
      );
      setBonusHistory((prev) => [...prev, detection.scoreBonus].slice(-100));

      onFaceSummaryUpdate?.({
        emotion_cn: detection.emotionCn,
        comment: detection.comment,
        score_bonus: detection.scoreBonus,
      });
    } catch (err) {
      console.warn('表情识别失败:', err);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [modelsReady, onDetectionUpdate, onFaceSummaryUpdate]);

  useEffect(() => {
    if (isActive) initializeCamera();
    else stopCamera();
    return () => stopCamera();
  }, [isActive, initializeCamera, stopCamera]);

  useEffect(() => {
    if (!isActive || !isCameraReady || !modelsReady) return;
    runDetection();
    intervalRef.current = setInterval(runDetection, DETECT_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isCameraReady, modelsReady, runDetection]);

  useEffect(() => {
    if (expressionHistory.length > 0 && onExpressionScore) {
      const recent = expressionHistory.slice(-20);
      let score = 70;
      score += (recent.filter((e) => e.expression === 'smile').length / recent.length) * 20;
      score -= (recent.filter((e) => e.expression === 'frown').length / recent.length) * 15;
      score += (recent.filter((e) => e.expression === 'open').length / recent.length) * 10;
      if (bonusHistory.length > 0) {
        const avg = bonusHistory.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, bonusHistory.length);
        score += avg;
      }
      onExpressionScore(Math.max(0, Math.min(100, Math.round(score))));
    }
  }, [expressionHistory, bonusHistory, onExpressionScore]);

  useEffect(() => {
    onEyeContactScore?.(75);
  }, [expressionHistory, onEyeContactScore]);

  useEffect(() => {
    onPostureScore?.(75);
  }, [expressionHistory, onPostureScore]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-black/20">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto"
        style={{ transform: 'scaleX(-1)' }}
      />
      {(!isCameraReady || !modelsReady) && isActive && (
        <div className={`absolute inset-0 flex items-center justify-center ${theme.videoOverlay}`}>
          <div className="text-center text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mx-auto mb-2" />
            {!modelsReady ? '加载表情模型...' : '启动摄像头...'}
          </div>
        </div>
      )}
      {lastEmotion && isCameraReady && (
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs ${theme.videoOverlay}`}>
          表情: {lastEmotion}
        </div>
      )}
      {modelsReady && isCameraReady && (
        <div className={`absolute bottom-2 left-2 right-2 px-2 py-1 rounded text-xs text-center ${theme.videoOverlay}`}>
          浏览器本地识别 · face-api.js
        </div>
      )}
    </div>
  );
};

export default FaceDetection;