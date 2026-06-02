import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { BACKEND_OFFLINE_MSG, fetchModelAnswer, mapPositionToJobType } from '../services/backendApi';
import { useTheme } from '../contexts/ThemeContext';

const ModelAnswerPanel = ({ question, position, keywords, onClose }) => {
  const { theme } = useTheme();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await fetchModelAnswer({
          question,
          job_type: mapPositionToJobType(position),
          keywords: keywords || [],
        });
        if (!cancelled) setContent(result.answer || result.model_answer || '');
      } catch (e) {
        if (!cancelled) {
          const offline = e.message === BACKEND_OFFLINE_MSG;
          setError(offline ? BACKEND_OFFLINE_MSG : '暂时无法获取示范回答');
          if (!offline) setContent(getLocalModelAnswer(question, keywords));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [question, position, keywords]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className={`rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col border ${theme.cardBg}`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme.accentBorder}`}>
          <h3 className={`font-semibold ${theme.accent}`}>AI 示范回答</h3>
          <button type="button" onClick={onClose} className={`${theme.muted} hover:opacity-80`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className={`flex items-center justify-center py-12 ${theme.accent}`}>
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              生成示范回答中...
            </div>
          ) : error ? (
            <p className={`text-sm mb-3 ${theme.muted}`}>
              {error}
              {content ? '，以下为参考模板：' : ''}
            </p>
          ) : null}
          {!loading && content && (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${theme.pageText}`}>{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

function getLocalModelAnswer(question, keywords = []) {
  const kw = keywords.slice(0, 3).join('、') || '核心能力';
  return `【参考结构】- STAR法则

针对“${question}”这类问题，建议按以下方式组织回答：

1. 情境（Situation）：简要说明背景，例如在学校项目/实习中的具体场景。
2. 任务（Task）：你承担的目标是什么，与${kw}相关。
3. 行动（Action）：你采取了哪些具体步骤，最好有数据或细节。
4. 结果（Result）：取得了什么成果，以及你的反思与收获。

示范开头：
“在我大三的XX实习中，我负责……首先我通过……最终实现了……这段经历让我对岗位有了更深的理解。”

提示：结合真实经历，控制在1-2分钟口述长度，语气自然自信。`;
}

export default ModelAnswerPanel;