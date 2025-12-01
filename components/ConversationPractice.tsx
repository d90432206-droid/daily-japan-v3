
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { createConversation, getNextSentenceHint, analyzeSentenceStructure, SentenceAnalysis } from '../services/geminiService';
import { Mic, Send, HelpCircle, Volume2, StopCircle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Chat } from "@google/genai";

interface ExtendedChatMessage extends ChatMessage {
  isAnalysis?: boolean;
  analysisData?: SentenceAnalysis;
}

export const ConversationPractice: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // For Web Speech API

  const startPractice = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      chatSessionRef.current = createConversation(topic);
      // Initial greeting
      const result = await chatSessionRef.current.sendMessage({ message: "会話を始めましょう。短い挨拶をしてください。" });
      const text = result.text;
      
      setMessages([{
        id: 'init',
        role: 'model',
        text: text,
      }]);
      setIsStarted(true);
      speak(text);
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;
    
    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setHint(null); // Clear previous hints

    try {
      const result = await chatSessionRef.current.sendMessage({ message: inputText });
      const modelText = result.text;
      
      const modelMsg: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText
      };
      
      setMessages(prev => [...prev, modelMsg]);
      speak(modelText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    
    // Add the user's sentence to chat UI first for context
    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: `「${inputText}」\n(この文をチェックしてください)`,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const analysis = await analyzeSentenceStructure(inputText);
      
      const analysisMsg: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '分析結果',
        isAnalysis: true,
        analysisData: analysis
      };

      setMessages(prev => [...prev, analysisMsg]);
      setInputText('');
    } catch (error) {
      console.error(error);
      alert("分析に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const showHint = async () => {
    if (!chatSessionRef.current) return;
    setIsLoading(true);
    const history = messages.map(m => `${m.role}: ${m.text}`).join('\n');
    const hints = await getNextSentenceHint(history, topic);
    setHint(hints);
    setIsLoading(false);
  };

  // Web Speech API for TTS
  const speak = (text: string) => {
    // Extract Chinese part roughly (before the parenthesis usually)
    const chinesePart = text.split('(')[0];
    const utterance = new SpeechSynthesisUtterance(chinesePart);
    utterance.lang = 'zh-TW'; // Taiwan Chinese
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API for STT
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("お使いのブラウザは音声認識をサポートしていません。");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-TW'; // Taiwan Chinese
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev ? prev + ' ' + transcript : transcript);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, hint]);

  const renderAnalysisContent = (data: SentenceAnalysis) => (
    <div className="bg-gray-800 text-white rounded-xl p-4 w-full max-w-sm mt-2 text-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-gray-600 pb-2">
        {data.isValid ? (
          <CheckCircle className="text-green-400" size={20} />
        ) : (
          <AlertCircle className="text-yellow-400" size={20} />
        )}
        <span className="font-bold text-lg">
          {data.isValid ? 'とても自然です！' : '少し修正が必要です'}
        </span>
      </div>

      <div className="space-y-4">
        {data.correction && (
          <div>
            <div className="text-xs text-gray-400 mb-1">修正提案</div>
            <div className="text-yellow-300 font-bold text-lg tracking-wide">{data.correction}</div>
          </div>
        )}

        <div>
          <div className="text-xs text-gray-400 mb-1">意味 (日本語)</div>
          <div className="font-medium">{data.meaning}</div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">発音 (注音符号)</div>
          <div className="text-sakura-300 font-bold tracking-widest">{data.pronunciation}</div>
        </div>

        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">単語分解</div>
          <div className="space-y-2">
            {data.breakdown.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-x-2 border-b border-gray-600/30 pb-1 last:border-0">
                <span className="text-yellow-200 font-bold">{item.word}</span>
                <span className="text-xs text-gray-300 font-mono">{item.bopomofo}</span>
                <span className="text-xs text-gray-400 ml-auto">{item.meaning}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">解説</div>
          <div className="text-gray-200 leading-relaxed text-xs">{data.explanation}</div>
        </div>
      </div>
      
      <button 
        onClick={() => speak(data.correction || messages[messages.length - 2]?.text?.split('\n')[0].replace('「', '').replace('」', '') || '')}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
      >
        <Volume2 size={16} /> 読み上げ
      </button>
    </div>
  );

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
        <div className="w-32 h-32 rounded-full bg-sakura-200 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden mb-4">
           {/* Placeholder for Jay Chou Q-style Avatar */}
           <img src="https://picsum.photos/200/200?random=1" alt="Avatar" className="w-full h-full object-cover opacity-80" />
        </div>
        <h2 className="text-2xl font-cute font-bold text-gray-800">每日會話練習</h2>
        <p className="text-gray-500">今日のテーマを決めて、ジェイ先生と楽しく会話しよう！</p>
        
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="例：旅行、買い物、タピオカ..."
          className="w-full max-w-xs px-4 py-3 rounded-full border border-sakura-300 focus:outline-none focus:ring-2 focus:ring-sakura-400 bg-white shadow-sm text-gray-800"
        />
        
        <button 
          onClick={startPractice}
          disabled={!topic || isLoading}
          className="w-full max-w-xs bg-sakura-400 text-white font-bold py-3 rounded-full shadow-md hover:bg-sakura-500 transition disabled:opacity-50"
        >
          {isLoading ? "準備中..." : "スタート！"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-t-3xl shadow-inner relative overflow-hidden">
       {/* Header */}
       <div className="bg-sakura-100 p-4 text-center font-bold text-gray-700 shadow-sm relative z-10 flex items-center justify-center">
         <span className="truncate max-w-[200px]">{topic}</span>
         <button onClick={() => setIsStarted(false)} className="absolute left-4 text-xs text-sakura-500 underline">終了</button>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
         {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.isAnalysis && msg.analysisData ? (
               renderAnalysisContent(msg.analysisData)
             ) : (
               <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-sakura-400 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                 <div className="text-base whitespace-pre-wrap">{msg.text}</div>
                 {msg.role === 'model' && (
                   <button onClick={() => speak(msg.text)} className="mt-1 opacity-50 hover:opacity-100 p-1">
                     <Volume2 size={16} />
                   </button>
                 )}
               </div>
             )}
           </div>
         ))}
         
         {hint && (
            <div className="mx-auto max-w-[90%] bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-sm text-gray-700 animate-fade-in">
              <div className="font-bold text-yellow-600 mb-1 flex items-center gap-1">
                <HelpCircle size={14} /> ヒント
              </div>
              <pre className="whitespace-pre-wrap font-sans">{hint}</pre>
            </div>
         )}
         
         <div ref={messagesEndRef} />
       </div>

       {/* Input Area */}
       <div className="absolute bottom-0 left-0 right-0 bg-white p-3 border-t border-gray-100 pb-20 md:pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <div className="flex flex-col gap-2">
            {/* Action Bar */}
            <div className="flex justify-between items-center px-1">
              <button onClick={showHint} disabled={isLoading} className="text-xs font-bold text-yellow-500 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                 <HelpCircle size={14} /> ヒント
              </button>
              {inputText.length > 0 && (
                <button 
                  onClick={handleAnalyze} 
                  disabled={isLoading}
                  className="text-xs font-bold text-sky-500 flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-full border border-sky-100"
                >
                  <Sparkles size={14} /> 文法チェック
                </button>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="中国語で入力..."
                  className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-sakura-400 bg-gray-50 text-gray-900"
                />
                <button 
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-100' : 'text-gray-400 hover:text-sakura-500'}`}
                >
                  {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                </button>
              </div>

              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading}
                className="p-3 bg-sakura-400 text-white rounded-full shadow-md hover:bg-sakura-500 disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
         </div>
       </div>
    </div>
  );
};
