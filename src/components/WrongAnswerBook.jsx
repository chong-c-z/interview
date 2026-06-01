import React from 'react';
import { X, Clock, BookOpen, Trash2 } from 'lucide-react';
import { removeWrongAnswer } from '../utils/storage';

const WrongAnswerBook = ({ wrongAnswers, onClose, onRemove }) => {
  const handleRemove = (id) => {
    removeWrongAnswer(id);
    onRemove(id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 text-red-400 mr-2" />
            <h2 className="text-xl font-bold text-white">错题本</h2>
            <span className="ml-2 px-2 py-1 bg-red-900 text-red-300 text-xs rounded-full">
              {wrongAnswers.length}题
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {wrongAnswers.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">还没有错题记录</p>
              <p className="text-sm text-gray-500 mt-1">继续练习，查漏补缺</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wrongAnswers.map((item) => (
                <div key={item.id} className="border border-red-800 rounded-lg p-4 bg-red-900 bg-opacity-20">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full mr-2">
                          {item.position}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <h3 className="font-medium text-white mb-2">
                        {item.question}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1 hover:bg-red-800 rounded text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-300">遗漏关键词：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.missingKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-300">全部关键词：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.allKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded ${
                              item.missingKeywords.includes(keyword)
                                ? 'bg-red-900 text-red-300'
                                : 'bg-green-900 text-green-300'
                            }`}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default WrongAnswerBook;
