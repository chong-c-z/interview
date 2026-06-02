import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete, duration = 2000 }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 400);
    const endTimer = setTimeout(() => onComplete?.(), duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0e17] transition-opacity duration-400 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/40 flex items-center justify-center animate-pulse">
          <span className="text-5xl font-bold text-amber-400 font-serif">✨</span>
        </div>
        <div className="absolute -inset-4 rounded-3xl border border-amber-500/20 animate-ping opacity-30" />
      </div>
      <h1 className="text-4xl font-bold text-amber-400 tracking-widest mb-3">镜面</h1>
      <p className="text-gray-400 text-sm tracking-wide">AI驱动的智能面试训练系统</p>
      <div className="mt-10 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;