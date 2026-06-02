// ============================================================
// 面霸竞技场前�?- 后端接口调用模块
// 把这个文件放到你的前端项目里，替换原来的 aiAnalysis.js
// ============================================================

const BACKEND_URL = "https://interview-3mns.onrender.com";

/**
 * 调用后端AI评分接口
 * @param {string} question - 面试题目
 * @param {string} answer   - 用户的回答（语音转文字）
 * @param {string} jobType  - 岗位类型：产�?前端/运营
 * @returns {Promise<Object>} 评分结果
 */
export async function scoreAnswer(question, answer, jobType = "产品") {
  try {
    const response = await fetch(`${BACKEND_URL}/score-answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, job_type: jobType }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("AI评分失败:", err);
    // 后端不可用时返回默认值，不影响前端运�?    return {
      total_score: 60,
      dimensions: { content: 15, logic: 15, specific: 15, match: 15 },
      interviewer_comment: "（AI评分暂时不可用，请检查后端是否启动）",
      improvements: ["请启动后端服务以获取真实AI评分"],
      highlight: "暂无",
    };
  }
}

/**
 * 调用后端面部表情分析接口
 * 传入 video �?canvas 元素，自动截帧发送给后端
 * @param {HTMLVideoElement|HTMLCanvasElement} videoOrCanvas
 * @returns {Promise<Object>} 表情分析结果
 */
export async function analyzeFace(videoOrCanvas) {
  try {
    // �?video �?canvas 截一�?    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoOrCanvas, 0, 0, 320, 240);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

    const response = await fetch(`${BACKEND_URL}/analyze-face`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("表情分析失败:", err);
    return {
      dominant_emotion: "neutral",
      emotion_cn: "平静",
      comment: "表情自然",
      score_bonus: 0,
      confidence: 0,
    };
  }
}

/**
 * 调用后端生成综合面试报告
 * @param {string} jobType        - 岗位类型
 * @param {Array}  qaList         - [{question, answer, score}, ...]
 * @param {Object} faceSummary    - {comment, avg_bonus}
 * @param {number} durationMinutes - 面试时长（分钟）
 * @returns {Promise<Object>} 报告内容
 */
export async function generateReport(jobType, qaList, faceSummary, durationMinutes = 5) {
  try {
    const response = await fetch(`${BACKEND_URL}/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_type: jobType,
        qa_list: qaList,
        face_summary: faceSummary,
        duration: durationMinutes,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("报告生成失败:", err);
    return {
      overall_score: 70,
      rank: "良好",
      summary: "（报告生成暂时不可用，请检查后端是否启动）",
      strengths: [],
      weaknesses: [],
      next_steps: [],
      hiring_tendency: "暂无",
    };
  }
}

// ============================================================
// 定时截帧分析面部（每3秒分析一次）
// 在面试模拟器组件里调用这个函�?// ============================================================
let faceAnalysisInterval = null;
let faceResults = [];

export function startFaceAnalysis(videoElement, onResult) {
  if (faceAnalysisInterval) clearInterval(faceAnalysisInterval);
  faceResults = [];

  faceAnalysisInterval = setInterval(async () => {
    const result = await analyzeFace(videoElement);
    faceResults.push(result);
    if (onResult) onResult(result);
  }, 3000); // �?秒分析一�?}

export function stopFaceAnalysis() {
  if (faceAnalysisInterval) {
    clearInterval(faceAnalysisInterval);
    faceAnalysisInterval = null;
  }
  // 返回这场面试的表情汇�?  if (faceResults.length === 0) return { comment: "无表情数�?, avg_bonus: 0 };

  const avgBonus = faceResults.reduce((sum, r) => sum + (r.score_bonus || 0), 0) / faceResults.length;
  const emotions = faceResults.map((r) => r.emotion_cn);
  const mostCommon = emotions.sort(
    (a, b) => emotions.filter((e) => e === b).length - emotions.filter((e) => e === a).length
  )[0];

  return {
    comment: `面试过程中主要表情为${mostCommon}`,
    avg_bonus: Math.round(avgBonus),
    all_results: faceResults,
  };
}
