import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { createConversation, getNextSentenceHint } from '../services/geminiService';
import { Mic, Send, HelpCircle, Volume2, StopCircle } from 'lucide-react';
import { Chat } from "@google/genai";

export const ConversationPractice: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    
    const userMsg: ChatMessage = {
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
      
      const modelMsg: ChatMessage = {
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
       <div className="bg-sakura-100 p-4 text-center font-bold text-gray-700 shadow-sm relative z-10">
         テーマ: {topic}
         <button onClick={() => setIsStarted(false)} className="absolute left-4 top-4 text-xs text-sakura-500 underline">終了</button>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
         {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-sakura-400 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
               <div className="text-base">{msg.text}</div>
               {msg.role === 'model' && (
                 <button onClick={() => speak(msg.text)} className="mt-1 opacity-50 hover:opacity-100">
                   <Volume2 size={16} />
                 </button>
               )}
             </div>
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
       <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 pb-20 md:pb-4">
         <div className="flex items-center gap-2">
            <button 
              onClick={showHint}
              disabled={isLoading}
              className="p-3 text-yellow-500 bg-yellow-50 rounded-full hover:bg-yellow-100"
            >
              <HelpCircle size={24} />
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="中国語で入力..."
                className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-sakura-400 bg-white text-gray-900"
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
              className="p-3 bg-sakura-400 text-white rounded-full shadow-md hover:bg-sakura-500 disabled:opacity-50"
            >
              <Send size={24} />
            </button>
         </div>
       </div>
    </div>
  );
};