
import React, { useState, useEffect, useRef } from 'react';
import { generateWallpapers, generateCreativePrompt, generateTopicSuggestions, setApiKey } from './services/geminiService';
import { GeneratedImage } from './types';
import { SparklesIcon, DownloadIcon, RefreshCwIcon, XIcon, MagicWandIcon, ChevronDownIcon, ArrowRightIcon, SettingsIcon } from './components/Icons';
import { Button } from './components/Button';
import { SettingsModal } from './components/SettingsModal';
import { safeStorage } from './utils/safeStorage';

export default function App() {
  // CRITICAL: Always initialize state with static values (null, '', false).
  // NEVER call safeStorage.getItem() here. It must be done in useEffect.
  const [apiKey, setApiKeyState] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeyLoaded, setIsKeyLoaded] = useState(false); // New state to track if we've finished checking storage

  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isRefreshingTopics, setIsRefreshingTopics] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [remixSource, setRemixSource] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [topics, setTopics] = useState<string[]>([
    "신비로운 오로라 숲", 
    "사이버펑크 네온 시티", 
    "따뜻한 지브리 감성", 
    "미니멀한 파스텔 패턴", 
    "비 오는 창가 풍경"
  ]);
  
  const [activeTheme, setActiveTheme] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  const resultsRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Initial Load: Safe Storage Access (Render First, Logic Later)
  useEffect(() => {
    const loadKey = () => {
      // This runs AFTER the first render, preventing black screens.
      const savedKey = safeStorage.getItem('moodpaper_api_key');
      
      if (savedKey) {
        setApiKeyState(savedKey);
        setApiKey(savedKey); // Sync with Service
      } else {
        // No key found? Show settings after a brief delay to allow UI to settle
        setTimeout(() => setIsSettingsOpen(true), 500);
      }
      setIsKeyLoaded(true);
    };

    loadKey();
  }, []);

  const handleKeySave = (newKey: string) => {
    setApiKeyState(newKey);
    setApiKey(newKey);
  };

  const checkApiKey = (): boolean => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      return false;
    }
    return true;
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!checkApiKey()) return;
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setImages([]); 
    
    try {
      const generatedImages = await generateWallpapers(prompt, remixSource?.url);
      setImages(generatedImages);
      if (remixSource) setRemixSource(null);
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `moodpaper-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleRemixStart = (image: GeneratedImage) => {
    setRemixSource(image);
    setPrompt(image.prompt); 
    setSelectedImage(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearRemix = () => {
    setRemixSource(null);
    setPrompt('');
  };

  const handlePresetTopicSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!checkApiKey()) return;
    const topic = e.target.value;
    if (!topic) return;

    setActiveTheme(topic);
    setCustomTopic('');
    
    setIsGeneratingPrompt(true);
    try {
        const newPrompt = await generateCreativePrompt(topic);
        setPrompt(newPrompt);
        setTimeout(() => promptRef.current?.focus(), 100);
    } catch (err) {
        console.error("Prompt generation failed", err);
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const handleCustomTopicSubmit = async () => {
    if (!checkApiKey()) return;
    if (!customTopic.trim()) return;

    setActiveTheme(customTopic);
    
    setIsGeneratingPrompt(true);
    try {
        const newPrompt = await generateCreativePrompt(customTopic);
        setPrompt(newPrompt);
        setTimeout(() => promptRef.current?.focus(), 100);
    } catch (err) {
        console.error("Prompt generation failed", err);
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const refreshPrompt = async () => {
    if (!checkApiKey()) return;
    if (!activeTheme) return;
    setIsGeneratingPrompt(true);
    try {
        const newPrompt = await generateCreativePrompt(activeTheme);
        setPrompt(newPrompt);
    } catch (err) {
        console.error("Prompt generation failed", err);
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const refreshTopics = async () => {
    if (!checkApiKey()) return;
    setIsRefreshingTopics(true);
    try {
        const newTopics = await generateTopicSuggestions();
        setTopics(newTopics);
        setActiveTheme('');
    } catch (err) {
        console.error("Topic refresh failed", err);
    } finally {
        setIsRefreshingTopics(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 font-sans selection:bg-purple-500/30">
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleKeySave}
        initialKey={apiKey}
      />

      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-slate-950 to-black -z-10" />
      
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
        
        <header className="pt-8 pb-6 px-6 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        MoodPaper
                    </h1>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    감성적인 테마를 선택하거나 직접 입력해보세요.
                </p>
            </div>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 bg-gray-900/50 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="설정"
            >
                <SettingsIcon className="w-5 h-5" />
            </button>
        </header>

        <section className="px-6 mb-8 sticky top-4 z-20">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl space-y-4">
                
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                value={topics.includes(activeTheme) ? activeTheme : ""}
                                onChange={handlePresetTopicSelect}
                                className="w-full appearance-none bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                                disabled={isRefreshingTopics}
                            >
                                <option value="">주제 선택하기...</option>
                                {topics.map((t, i) => (
                                    <option key={i} value={t}>{t}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <button 
                            onClick={refreshTopics}
                            disabled={isRefreshingTopics}
                            className="bg-gray-800 border border-white/10 rounded-xl px-3 hover:bg-gray-700 text-purple-400 disabled:opacity-50 transition-colors"
                            title="주제 새로고침"
                        >
                            <MagicWandIcon className={`w-5 h-5 ${isRefreshingTopics ? 'animate-pulse' : ''}`} />
                        </button>
                    </div>

                    <div className="relative">
                        <input 
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                            placeholder="또는 원하는 주제 직접 입력..."
                            className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-purple-500 transition-colors text-sm placeholder-gray-500"
                        />
                        <button
                            onClick={handleCustomTopicSubmit}
                            disabled={!customTopic.trim() || isGeneratingPrompt}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-gray-700 hover:bg-purple-600 rounded-lg text-white/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="프롬프트 생성"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {remixSource && (
                    <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2">
                        <img 
                            src={remixSource.url} 
                            alt="Remix source" 
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-purple-400 block mb-0.5">Remixing...</span>
                            <p className="text-xs text-gray-400 truncate">이 이미지를 기반으로 변형합니다</p>
                        </div>
                        <button onClick={clearRemix} className="p-1 hover:bg-white/10 rounded-full text-gray-400">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                
                <form onSubmit={handleGenerate}>
                    <div className="relative">
                        <textarea
                            ref={promptRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={isGeneratingPrompt ? "AI가 프롬프트를 작성 중입니다..." : (isKeyLoaded && !apiKey ? "설정 버튼을 눌러 API 키를 입력해주세요." : "최종 프롬프트가 여기에 표시됩니다.")}
                            className={`w-full bg-black/20 text-white placeholder-gray-500 rounded-xl p-3 text-base outline-none resize-none mb-4 border border-transparent focus:border-white/10 transition-colors min-h-[100px] ${isGeneratingPrompt ? 'animate-pulse' : ''}`}
                            disabled={isGeneratingPrompt}
                        />
                        {activeTheme && !isGeneratingPrompt && apiKey && (
                            <button
                                type="button"
                                onClick={refreshPrompt}
                                className="absolute right-2 bottom-6 p-1.5 text-xs bg-gray-700/50 hover:bg-purple-600/50 text-white/70 hover:text-white rounded-lg backdrop-blur-sm transition-all flex items-center gap-1"
                            >
                                <RefreshCwIcon className="w-3 h-3" />
                                <span>다시 쓰기</span>
                            </button>
                        )}
                    </div>

                    <Button 
                        type="submit" 
                        fullWidth 
                        disabled={isLoading || !prompt.trim() || isGeneratingPrompt}
                        variant={!apiKey ? 'secondary' : 'primary'}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {remixSource ? '변형 중...' : '생성 중...'}
                            </span>
                        ) : (
                            <>
                                <SparklesIcon className="w-4 h-4" />
                                {remixSource ? '다시 그리기 (Remix)' : (images.length > 0 ? '재생성' : '생성하기')}
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </section>

        <div ref={resultsRef} className="flex-1 px-4">
            {error && (
                <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
                    <p className="text-red-400 text-sm">{error}</p>
                    {!apiKey && (
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="mt-2 text-xs text-purple-400 underline hover:text-purple-300"
                        >
                            API Key 설정하기
                        </button>
                    )}
                </div>
            )}

            {isLoading && !images.length && (
                <div className="grid grid-cols-2 gap-3 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[9/16] bg-gray-800/50 rounded-2xl border border-white/5" />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 pb-8">
                {images.map((img) => (
                    <button
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-transform active:scale-95"
                    >
                        <img
                            src={img.url}
                            alt={img.prompt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                ))}
            </div>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-white/70 text-sm font-medium">미리보기</span>
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="max-h-full max-w-full rounded-lg shadow-2xl object-contain"
                />
            </div>

            <div className="p-6 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent">
                <div className="flex gap-3">
                    <Button 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => handleRemixStart(selectedImage)}
                    >
                        <RefreshCwIcon className="w-4 h-4" />
                        Remix
                    </Button>
                    <Button 
                        variant="primary" 
                        className="flex-1"
                        onClick={() => handleDownload(selectedImage)}
                    >
                        <DownloadIcon className="w-4 h-4" />
                        다운로드
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
