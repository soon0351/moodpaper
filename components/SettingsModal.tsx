
import React, { useState } from 'react';
import { Button } from './Button';
import { XIcon } from './Icons';
import { validateApiKey } from '../services/geminiService';
import { safeStorage } from '../utils/safeStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialKey 
}) => {
  const [key, setKey] = useState(initialKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!key.trim()) {
      setError("API Key를 입력해주세요.");
      return;
    }

    setIsValidating(true);
    setError(null);

    const isValid = await validateApiKey(key.trim());
    
    setIsValidating(false);

    if (isValid) {
      // Use safeStorage to prevent crashes in restrictive environments
      safeStorage.setItem('moodpaper_api_key', key.trim());
      
      onSave(key.trim());
      onClose();
    } else {
      setError("유효하지 않은 API Key입니다. 연결할 수 없습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">설정</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Gemini API Key</label>
            <input 
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AI Studio 키를 입력하세요"
              className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">
              키는 사용자의 브라우저에만 저장되며, 서버로 전송되지 않습니다.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button 
            fullWidth 
            onClick={handleSave} 
            disabled={isValidating || !key.trim()}
          >
            {isValidating ? "연결 확인 중..." : "저장하기"}
          </Button>
          
          <div className="text-center pt-2">
             <a 
               href="https://aistudio.google.com/app/apikey" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-xs text-purple-400 hover:text-purple-300 underline"
             >
               API Key 발급받기
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};
