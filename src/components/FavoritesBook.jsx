import React from 'react';
import { X, Star, Trash2 } from 'lucide-react';

const positionNames = { product: '产品', frontend: '前端', operation: '运营' };

const FavoritesBook = ({ favorites, onClose, onRemove }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="bg-[#121820] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <h2 className="font-bold text-amber-400">收藏题目</h2>
          <span className="text-xs text-gray-500">({favorites.length})</span>
        </div>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {favorites.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-sm">
            答题评分后可点击「收藏本题�?
          </p>
        ) : (
          favorites.map((item) => (
            <div
              key={item.id}
              className="mb-3 p-4 rounded-lg border border-amber-900/30 bg-amber-900/10"
            >
              <div className="flex justify-between gap-2">
                <div>
                  <span className="text-xs text-amber-500/80">
                    {positionNames[item.position]} · {item.category || '综合'}
                  </span>
                  <p className="text-sm text-gray-200 mt-1">{item.question}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="text-gray-500 hover:text-red-400 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default FavoritesBook;
