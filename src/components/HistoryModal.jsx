import React from 'react';
import { X, Clock, Briefcase } from 'lucide-react';

const positionNames = { product: '产品', frontend: '前端', operation: '运营' };

const HistoryModal = ({ history, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="bg-[#121820] border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="font-bold text-amber-400">历史记录</h2>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {history.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">暂无面试记录</p>
        ) : (
          <ul className="space-y-3">
            {history.map((item) => (
              <li
                key={item.id}
                className="p-3 rounded-lg bg-[#0a0e17] border border-gray-800"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="flex items-center gap-1 text-sm text-gray-300">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    {positionNames[item.position] || item.position}
                  </span>
                  <span className="text-amber-400 font-bold text-sm">{item.avgScore}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleString('zh-CN')}
                </div>
                <div className="text-xs text-gray-600 mt-1">{item.questionCount} 题</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

export default HistoryModal;