import React, { useEffect, useState } from 'react';
import { Star, Trophy, Zap } from 'lucide-react';

const CelebrationAnimation = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete && onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  const encouragements = [
    '太棒了！三连击！',
    '完美表现！继续保持！',
    '这就是面霸水准！',
    '优秀！下一个挑战！',
    '精彩回答！势不可挡！'
  ];

  const randomMessage = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* 彩带效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'][
                  Math.floor(Math.random() * 5)
                ]
              }`}
            />
          </div>
        ))}
      </div>

      {/* 中心庆祝内容 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl text-center transform animate-pulse border border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-16 h-16 text-yellow-500" />
              <Star className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-spin" />
              <Zap className="w-6 h-6 text-blue-500 absolute -bottom-1 -left-1 animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {randomMessage}
          </h2>
          
          <p className="text-gray-300">
            连续答对3题！经验值+50！
          </p>
          
          <div className="mt-4 flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <Star
                key={i}
                className="w-6 h-6 text-yellow-400 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebrationAnimation;
