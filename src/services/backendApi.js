const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const REQUEST_TIMEOUT_MS = 60000;

export const BACKEND_OFFLINE_MSG =
  '后端服务未启动，请先运行 python app.py';

const JOB_TYPE_MAP = {
  product: '产品',
  frontend: '前端',
  operation: '运营',
};

export const mapPositionToJobType = (position) =>
  JOB_TYPE_MAP[position] || position || '产品';

function isConnectionError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('connection error') ||
    msg.includes('load failed') ||
    msg.includes('fetch')
  );
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const message = data?.error || `请求失败 (${response.status})`;
      throw new Error(message);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查后端服务是否正常运行');
    }
    if (isConnectionError(error)) {
      throw new Error(BACKEND_OFFLINE_MSG);
    }
    throw error;
  }
}

/** 统一 AI 接口：mode 可选 score | interview_chat | interview_summary | model_answer */
export async function scoreAnswer(payload) {
  return fetchWithTimeout(`${API_BASE_URL}/score-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function generateReport({ job_type, qa_list, face_summary, duration }) {
  return fetchWithTimeout(`${API_BASE_URL}/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_type, qa_list, face_summary, duration }),
  });
}

export async function fetchModelAnswer({ question, job_type, keywords }) {
  return scoreAnswer({
    mode: 'model_answer',
    question,
    job_type,
    keywords,
  });
}

export async function realInterviewChat({ job_type, messages }) {
  return scoreAnswer({
    mode: 'interview_chat',
    job_type,
    messages,
  });
}

export async function realInterviewSummary({ job_type, messages }) {
  return scoreAnswer({
    mode: 'interview_summary',
    job_type,
    messages,
  });
}

export async function checkBackendHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export { API_BASE_URL };
