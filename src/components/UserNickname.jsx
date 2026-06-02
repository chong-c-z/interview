import React, { useState } from 'react';
import { User, Pencil, Check } from 'lucide-react';
import { getNickname, setNickname } from '../utils/appStorage';

const UserNickname = ({ onNicknameChange }) => {
  const [nickname, setNick] = useState(getNickname);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);

  const save = () => {
   const name = draft.trim() || '面试者';
    setNickname(name);
    setNick(name);
    setEditing(false);
    onNicknameChange?.(name);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
        <User className="w-4 h-4 text-amber-400" />
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={12}
            className="w-24 px-2 py-1 text-sm bg-[#121820] border border-gray-700 rounded text-gray-200"
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <button type="button" onClick={save} className="p-1 text-emerald-400 hover:text-emerald-300">
            <Check className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="text-sm font-medium text-gray-200">{nickname}</span>
          <button
            type="button"
            onClick={() => {
              setDraft(nickname);
              setEditing(true);
            }}
            className="p-1 text-gray-500 hover:text-amber-400"
            title="修改昵称"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

export default UserNickname;
