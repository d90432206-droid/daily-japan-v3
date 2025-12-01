import React, { useState, useEffect } from 'react';
import { generateVocabulary } from '../services/geminiService';
import { VocabWord, Difficulty } from '../types';
import { RefreshCw, Heart, Trash2, BookOpen } from 'lucide-react';

const CATEGORIES = [
  "旅行", "食事", "買い物", "仕事", "恋愛", "学校", "アニメ", "ネットスラング", "病院"
];

const MAX_REFRESH_PER_DAY = 10;

export const Vocabulary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [generatedWords, setGeneratedWords] = useState<VocabWord[]>([]);
  const [savedWords, setSavedWords] = useState<VocabWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'generate' | 'saved'>('generate');
  
  // Refresh Limit State
  const [refreshCount, setRefreshCount] = useState(0);

  // Load saved words and refresh count on mount
  useEffect(() => {
    const saved = localStorage.getItem('vocab_db');
    if (saved) {
      setSavedWords(JSON.parse(saved));
    }

    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('vocab_last_refresh_date');
    const storedCount = localStorage.getItem('vocab_refresh_count');

    if (storedDate === today && storedCount) {
      setRefreshCount(parseInt(storedCount, 10));
    } else {
      setRefreshCount(0);
      localStorage.setItem('vocab_last_refresh_date', today);
      localStorage.setItem('vocab_refresh_count', '0');
    }
  }, []);

  // Save to localStorage whenever savedWords changes
  useEffect(() => {
    localStorage.setItem('vocab_db', JSON.stringify(savedWords));
  }, [savedWords]);

  const updateRefreshCount = () => {
    const newCount = refreshCount + 1;
    setRefreshCount(newCount);
    localStorage.setItem('vocab_refresh_count', newCount.toString());
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('vocab_last_refresh_date', today);
  };

  const handleGenerate = async () => {
    if (refreshCount >= MAX_REFRESH_PER_DAY) {
      alert(`今日の更新回数制限（${MAX_REFRESH_PER_DAY}回）に達しました。明日また来てください！`);
      return;
    }

    setIsLoading(true);
    // Collect words to exclude (both currently shown generated ones and saved ones)
    const excludeList = [
      ...generatedWords.map(w => w.chinese),
      ...savedWords.map(w => w.chinese)
    ];

    // Clear previous generated words only after we start, but we want to show loading
    setGeneratedWords([]); 
    
    try {
      const words = await generateVocabulary(selectedCategory, difficulty, excludeList);
      setGeneratedWords(words);
      updateRefreshCount();
    } catch (error) {
      console.error(error);
      alert("生成に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = (word: VocabWord) => {
    const isSaved = savedWords.some(w => w.id === word.id);
    if (isSaved) {
      setSavedWords(prev => prev.filter(w => w.id !== word.id));
    } else {
      setSavedWords(prev => [...prev, { ...word, savedAt: Date.now() }]);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header Tabs */}
      <div className="flex bg-white shadow-sm z-10">
        <button
          onClick={() => setView('generate')}
          className={`flex-1 py-4 font-bold text-center transition ${view === 'generate' ? 'text-sakura-500 border-b-2 border-sakura-500' : 'text-gray-400'}`}
        >
          新しい単語
        </button>
        <button
          onClick={() => setView('saved')}
          className={`flex-1 py-4 font-bold text-center transition ${view === 'saved' ? 'text-sakura-500 border-b-2 border-sakura-500' : 'text-gray-400'}`}
        >
          保存 ({savedWords.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {view === 'generate' ? (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                 <label className="block text-xs font-bold text-gray-400 uppercase">設定</label>
                 <span className="text-xs font-bold text-sakura-500">残り更新回数: {MAX_REFRESH_PER_DAY - refreshCount}/{MAX_REFRESH_PER_DAY}</span>
              </div>
              
              <div className="flex gap-2 items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 p-3 bg-sakura-50 rounded-xl border-none outline-none font-bold text-gray-700"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                 <button 
                   onClick={() => setDifficulty('EASY')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${difficulty === 'EASY' ? 'bg-white shadow text-sakura-500' : 'text-gray-400'}`}
                 >
                   日常 (Easy)
                 </button>
                 <button 
                   onClick={() => setDifficulty('MIDDLE')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${difficulty === 'MIDDLE' ? 'bg-white shadow text-sakura-500' : 'text-gray-400'}`}
                 >
                   一般 (Mid)
                 </button>
                 <button 
                   onClick={() => setDifficulty('HARD')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${difficulty === 'HARD' ? 'bg-white shadow text-sakura-500' : 'text-gray-400'}`}
                 >
                   新聞 (Hard)
                 </button>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading || refreshCount >= MAX_REFRESH_PER_DAY}
                className="w-full bg-sakura-400 text-white p-3 rounded-xl shadow-md hover:bg-sakura-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                {isLoading ? "生成中..." : "単語を生成する"}
              </button>
            </div>

            <div className="grid gap-3">
              {generatedWords.map((word) => {
                const isSaved = savedWords.some(w => w.chinese === word.chinese); 
                return (
                  <div key={word.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center animate-fade-in">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{word.chinese}</h3>
                      <p className="text-sm text-sakura-600 font-bold mb-0.5">{word.zhuyin}</p>
                      <p className="text-xs text-gray-400 font-mono mb-1">{word.pinyin}</p>
                      <p className="text-gray-600">{word.japanese}</p>
                    </div>
                    <button
                      onClick={() => toggleSave(word)}
                      className={`p-3 rounded-full transition ${isSaved ? 'text-sakura-500 bg-sakura-50' : 'text-gray-300 hover:text-sakura-300'}`}
                    >
                      <Heart size={24} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>
                );
              })}
              {generatedWords.length === 0 && !isLoading && (
                 <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                   <BookOpen size={48} className="mb-2 opacity-20" />
                   <p>カテゴリと難易度を選んで<br/>単語を生成しよう！</p>
                 </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             {savedWords.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <p>保存された単語はありません。</p>
                </div>
             ) : (
               savedWords.map((word) => (
                 <div key={word.id} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-sakura-300 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-300 font-bold mb-1 block">{word.category}</span>
                      <h3 className="text-xl font-bold text-gray-800">{word.chinese}</h3>
                      <p className="text-sm text-sakura-600 font-bold">{word.zhuyin}</p>
                      <p className="text-xs text-gray-400 font-mono">{word.pinyin}</p>
                      <p className="text-gray-600 mt-1">{word.japanese}</p>
                    </div>
                    <button
                      onClick={() => toggleSave(word)}
                      className="text-gray-300 hover:text-red-400 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
               ))
             )}
          </div>
        )}
      </div>
    </div>
  );
};