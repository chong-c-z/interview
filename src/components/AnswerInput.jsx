import React from 'react';
import { Mic, Square } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AnswerInput = ({
  value,
  onChange,
  onFocus,
  disabled,
  isListening,
  isMicSupported,
  onToggleMic,
  minLength = 15,
  answerError,
  label = '请回答这个问题',
}) => {
  const { theme } = useTheme();

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${theme.label}`}>{label}</label>
      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          placeholder="说说你的想法，或点击麦克风语音输入..."
          className={`w-full h-36 p-3 pr-14 rounded-lg focus:ring-2 focus:ring-blue-500/40 resize-none border ${theme.inputBg}`}
          disabled={disabled}
        />
        {isMicSupported ? (
          <button
            type="button"
            onClick={onToggleMic}
            disabled={disabled}
            className={`absolute right-3 top-3 p-2.5 rounded-full transition-all ${
              isListening
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/40'
                : `${theme.btnSecondary}`
            }`}
            title={isListening ? '停止录音' : '语音输入'}
            aria-label={isListening ? '停止录音' : '开始语音输入'}
          >
            {isListening ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        ) : null}
      </div>

      {isListening && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          正在录音...
        </div>
      )}

      {!isMicSupported && (
        <p className={`mt-2 text-xs ${theme.muted}`}>当前浏览器不支持语音输入，请手动输入</p>
      )}

      {answerError && <p className="mt-2 text-sm text-red-500">{answerError}</p>}
      <p className={`mt-1 text-xs ${theme.muted}`}>
        至少输入 {minLength} 个字（当前 {value.trim().length} 字）
      </p>
    </div>
  );
};

export default AnswerInput;