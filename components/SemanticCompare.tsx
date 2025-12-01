import React, { useState } from 'react';
import { analyzeSemanticDifference } from '../services/geminiService';
import { SemanticResult } from '../types';
import { Sparkles, ArrowRight } from 'lucide-react';

export const SemanticCompare: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SemanticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const data = await analyzeSemanticDifference(query);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("解析に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto pb-24">
      <div className="text-center">
        <h2 className="text-2xl font-cute font-bold text-gray-800 mb-2">語意比對</h2>
        <p className="text-sm text-gray-500">似ている言葉の違い、ニュアンスをAIが詳しく日本語で解説します。</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-md border border-sakura-100">
        <label className="block text-sm font-bold text-gray-600 mb-2">気になる言葉を入力</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例：了解 と 理解"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sakura-300 bg-white text-gray-900 font-bold shadow-sm placeholder-gray-400"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!query.trim() || isLoading}
          className="w-full mt-4 bg-sky-500 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-sky-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Sparkles size={18} /> 解析する
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-sakura-400">
            <h3 className="font-bold text-lg text-gray-800 mb-2">解説</h3>
            <p className="text-gray-700 leading-relaxed">{result.explanation}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-sky-400">
            <h3 className="font-bold text-lg text-gray-800 mb-2">ニュアンスの違い</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.differences}</p>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl shadow-inner">
            <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">例文</h3>
            <ul className="space-y-3">
              {result.examples.map((ex, idx) => (
                <li key={idx} className="flex gap-3 text-gray-700 items-start">
                  <ArrowRight size={16} className="text-sakura-400 mt-1 flex-shrink-0" />
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};