import React, { useState } from 'react';
import { getWeeklyNews } from '../services/geminiService';
import { Newspaper, RefreshCw, ExternalLink } from 'lucide-react';

export const NewsLearning: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [groundingMetadata, setGroundingMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const result = await getWeeklyNews();
      setContent(result.content);
      setGroundingMetadata(result.groundingMetadata);
      setHasLoaded(true);
    } catch (error) {
      console.error(error);
      alert("ニュースの取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render basic markdown-like content safely
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) {
        return <h3 key={i} className="text-lg font-bold text-sakura-500 mt-4 mb-2">{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
         return <strong key={i} className="block mt-2 mb-1 text-gray-800">{line.replace(/\*\*/g, '')}</strong>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc text-gray-700 my-1">{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-gray-700 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      <div className="bg-white p-6 shadow-sm z-10 text-center">
        <h2 className="text-2xl font-cute font-bold text-gray-800 mb-2">今週のニュース</h2>
        <p className="text-sm text-gray-500 mb-4">台湾・中華圏の最新トレンドで中国語を学ぼう</p>
        
        <button
          onClick={loadNews}
          disabled={isLoading}
          className="bg-sky-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-sky-600 disabled:opacity-50 font-bold flex items-center justify-center gap-2 mx-auto"
        >
          {isLoading ? (
            <><RefreshCw className="animate-spin" size={20} /> 検索中...</>
          ) : (
            <><Newspaper size={20} /> ニュースを取得</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {hasLoaded ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
             <div className="prose prose-pink max-w-none">
                {renderContent(content)}
             </div>

             {/* Grounding Sources (Google Search Results) */}
             {groundingMetadata?.groundingChunks && (
               <div className="mt-8 pt-4 border-t border-gray-100">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">参照元</h4>
                 <div className="space-y-2">
                   {groundingMetadata.groundingChunks.map((chunk: any, index: number) => {
                     if (chunk.web?.uri) {
                       return (
                         <a 
                           key={index} 
                           href={chunk.web.uri} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center gap-2 text-xs text-sky-500 hover:underline truncate"
                         >
                           <ExternalLink size={12} />
                           {chunk.web.title || chunk.web.uri}
                         </a>
                       );
                     }
                     return null;
                   })}
                 </div>
               </div>
             )}
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 opacity-50">
              <Newspaper size={64} className="mb-4" />
              <p>ボタンを押してニュースを検索してください</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};