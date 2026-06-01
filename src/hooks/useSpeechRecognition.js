import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeechRecognition({ onTranscript, lang = 'zh-CN' }) {
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += text;
        } else {
          interim += text;
        }
      }

      const combined = baseTextRef.current + finalText + interim;
      onTranscript?.(combined.trim());
      if (finalText) {
        baseTextRef.current = (baseTextRef.current + finalText).trim();
        if (baseTextRef.current) baseTextRef.current += ' ';
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.warn('语音识别错误:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, [lang, onTranscript]);

  const startListening = useCallback((currentText = '') => {
    if (!recognitionRef.current) return;
    baseTextRef.current = currentText ? `${currentText.trim()} ` : '';
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('无法启动录音:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(
    (currentText = '') => {
      if (isListening) stopListening();
      else startListening(currentText);
    },
    [isListening, startListening, stopListening]
  );

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
    toggleListening,
  };
}
