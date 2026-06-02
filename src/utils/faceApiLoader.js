import * as faceapi from 'face-api.js';

const MODEL_URL =
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

let loadPromise = null;

export function loadFaceApiModels() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  }
  return loadPromise;
}

const EXPRESSION_CN = {
  happy: { cn: '微笑', bonus: 10, comment: '面带笑容，给人积极印象' },
  neutral: { cn: '平静', bonus: 5, comment: '表情自然，状态稳定' },
  sad: { cn: '悲伤', bonus: -5, comment: '表情有些低落，注意调整状态' },
  angry: { cn: '紧张', bonus: -8, comment: '面部略显紧张，深呼吸放松' },
  fearful: { cn: '紧张', bonus: -8, comment: '看起来有些紧张，保持自信' },
  disgusted: { cn: '不悦', bonus: -10, comment: '注意面部放松' },
  surprised: { cn: '惊讶', bonus: 0, comment: '表情较为生动' },
};

const EXPRESSION_TO_TYPE = {
  happy: 'smile',
  neutral: 'neutral',
  sad: 'frown',
  angry: 'frown',
  fearful: 'frown',
  disgusted: 'frown',
  surprised: 'open',
};

function detectHeadDown(landmarks, box) {
  try {
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();
    if (!nose?.length || !jaw?.length) return false;
    const noseY = nose[Math.floor(nose.length / 2)].y;
    const jawY = jaw.reduce((s, p) => s + p.y, 0) / jaw.length;
    return noseY > jawY + box.height * 0.03;
  } catch {
    return false;
  }
}

export async function analyzeVideoFrame(video) {
  await loadFaceApiModels();

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.5,
  });

  const result = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks(true)
    .withFaceExpressions();

  if (!result) {
    return {
      expression: 'neutral',
      emotionCn: '未检测到人脸',
      comment: '请将面部保持在画面中',
      scoreBonus: 0,
      headDown: false,
      headPose: 'upright',
      eyeDirection: 'center',
      confidence: 0,
      fromBackend: false,
      faceApi: true,
      timestamp: Date.now(),
    };
  }

  const expressions = result.expressions.asSortedArray();
  const top = expressions[0];
  const key = top?.expression || 'neutral';
  const info = EXPRESSION_CN[key] || EXPRESSION_CN.neutral;
  const headDown = detectHeadDown(result.landmarks, result.detection.box);

  return {
    expression: EXPRESSION_TO_TYPE[key] || 'neutral',
    emotionCn: info.cn,
    comment: info.comment,
    scoreBonus: info.bonus,
    headDown,
    headPose: headDown ? 'forward' : 'upright',
    eyeDirection: 'center',
    confidence: Math.round((top?.probability || 0) * 100),
    fromBackend: false,
    faceApi: true,
    timestamp: Date.now(),
  };
}