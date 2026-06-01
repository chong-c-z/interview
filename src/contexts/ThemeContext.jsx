import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'jingmian_theme';

const darkTheme = {
  id: 'dark',
  pageBg: 'bg-[#0a0e17]',
  pageText: 'text-gray-100',
  headerBg: 'bg-[#0a0e17]/95 border-gray-800',
  cardBg: 'bg-[#121820] border-gray-800',
  cardMuted: 'bg-[#0a0e17] border-gray-800',
  inputBg: 'bg-[#121820] border-gray-700 text-gray-100',
  label: 'text-gray-300',
  muted: 'text-gray-500',
  accent: 'text-amber-400',
  accentBg: 'bg-amber-600 hover:bg-amber-500 text-[#0a0e17]',
  accentBorder: 'border-amber-500/30',
  btnSecondary: 'bg-gray-800 text-gray-300 hover:bg-gray-700',
  brand: 'text-amber-400',
  toggleBtn: 'text-gray-400 hover:text-amber-400 hover:bg-gray-800',
  bubbleAi: 'bg-gray-800 text-gray-100',
  bubbleUser: 'bg-amber-600 text-[#0a0e17]',
  videoOverlay: 'bg-black/40 text-white',
};

const lightTheme = {
  id: 'light',
  pageBg: 'bg-slate-50',
  pageText: 'text-slate-900',
  headerBg: 'bg-white/95 border-slate-200',
  cardBg: 'bg-white border-slate-200 shadow-sm',
  cardMuted: 'bg-slate-50 border-slate-200',
  inputBg: 'bg-white border-slate-300 text-slate-900',
  label: 'text-slate-700',
  muted: 'text-slate-500',
  accent: 'text-blue-600',
  accentBg: 'bg-blue-600 hover:bg-blue-700 text-white',
  accentBorder: 'border-blue-200',
  btnSecondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  brand: 'text-blue-700',
  toggleBtn: 'text-slate-500 hover:text-blue-600 hover:bg-slate-100',
  bubbleAi: 'bg-slate-100 text-slate-800 border border-slate-200',
  bubbleUser: 'bg-emerald-600 text-white',
  videoOverlay: 'bg-white/80 text-slate-700',
};

const ThemeContext = createContext({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    return true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme: () => setIsDark((d) => !d),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
