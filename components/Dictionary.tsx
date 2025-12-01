import React, { useState } from 'react';
import { searchDictionary } from '../services/geminiService';
import { DictionaryResult } from '../types';
import { Search, Book, Volume2 } from 'lucide-react';

export const Dictionary: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await searchDictionary(query);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("検索に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string) => {
    // Stop any current speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW'; // Taiwan Chinese
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto pb-24">
      <div className="text-center">
        <h2 className="text-2xl font-cute font-bold text-gray-800 mb-2">日中/中日辞書</h2>
        <p className="text-sm text-gray-500">日本語または中国語を入力してください。</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="言葉を入力..."
          className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-sakura-100 focus:outline-none focus:border-sakura-400 shadow-sm text-lg text-gray-900 bg-white"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        <button
           onClick={handleSearch}
           disabled={isLoading}
           className="absolute right-2 top-1/2 -translate-y-1/2 bg-sakura-400 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-sakura-500 transition disabled:opacity-50"
        >
          検索
        </button>
      </div>

      {isLoading && (
         <div className="flex justify-center py-10">
            <div className="animate-bounce text-sakura-400 text-xl font-cute">検索中...</div>
         </div>
      )}

      {result && !isLoading && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
          <div className="bg-sakura-50 p-6 border-b border-sakura-100">
            <div className="flex justify-between items-start">
              <h3 className="text-3xl font-bold text-gray-800 mb-1">{result.word}</h3>
              <button onClick={() => speak(result.word)} className="p-2 bg-white rounded-full text-sakura-500 hover:bg-sakura-100 shadow-sm">
                <Volume2 size={20} />
              </button>
            </div>
            <div className="flex flex-col">
              {result.zhuyin && <p className="text-sakura-600 font-bold text-lg">{result.zhuyin}</p>}
              {result.pinyin && <p className="text-gray-400 font-mono text-sm">{result.pinyin}</p>}
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h4 className="flex items-center gap-2 font-bold text-gray-600 mb-2">
                <Book size={18} /> 意味
              </h4>
              <p className="text-lg text-gray-800 leading-relaxed">{result.meaning}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-600 mb-3 border-b pb-1 inline-block">例文</h4>
              <div className="space-y-4">
                {result.examples.map((ex, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-xl relative group">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-lg font-medium text-gray-800 mb-1 leading-snug">{ex.sentence}</p>
                      <button 
                        onClick={() => speak(ex.sentence)} 
                        className="p-2 text-sakura-400 hover:text-white hover:bg-sakura-400 rounded-full bg-white shadow-sm transition-colors flex-shrink-0"
                        title="発音を聞く"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{ex.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};