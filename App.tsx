import React, { useState } from 'react';
import { ConversationPractice } from './components/ConversationPractice';
import { SemanticCompare } from './components/SemanticCompare';
import { Dictionary } from './components/Dictionary';
import { Vocabulary } from './components/Vocabulary';
import { NewsLearning } from './components/NewsLearning';
import { AppTab } from './types';
import { MessageCircle, Scale, Book, Library, Newspaper } from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.CONVERSATION);

  const renderContent = () => {
    switch (currentTab) {
      case AppTab.CONVERSATION:
        return <ConversationPractice />;
      case AppTab.SEMANTIC:
        return <SemanticCompare />;
      case AppTab.DICTIONARY:
        return <Dictionary />;
      case AppTab.VOCABULARY:
        return <Vocabulary />;
      case AppTab.NEWS:
        return <NewsLearning />;
      default:
        return <ConversationPractice />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative font-sans">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          <NavButton 
            active={currentTab === AppTab.CONVERSATION} 
            onClick={() => setCurrentTab(AppTab.CONVERSATION)}
            icon={<MessageCircle size={20} />}
            label="会話"
          />
          <NavButton 
            active={currentTab === AppTab.SEMANTIC} 
            onClick={() => setCurrentTab(AppTab.SEMANTIC)}
            icon={<Scale size={20} />}
            label="比對"
          />
          <NavButton 
            active={currentTab === AppTab.DICTIONARY} 
            onClick={() => setCurrentTab(AppTab.DICTIONARY)}
            icon={<Book size={20} />}
            label="辞書"
          />
          <NavButton 
            active={currentTab === AppTab.VOCABULARY} 
            onClick={() => setCurrentTab(AppTab.VOCABULARY)}
            icon={<Library size={20} />}
            label="単語"
          />
          <NavButton 
            active={currentTab === AppTab.NEWS} 
            onClick={() => setCurrentTab(AppTab.NEWS)}
            icon={<Newspaper size={20} />}
            label="ニュース"
          />
        </div>
      </nav>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
      active ? 'text-sakura-500' : 'text-gray-400 hover:text-sakura-300'
    }`}
  >
    <div className={`transform transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold mt-1">{label}</span>
  </button>
);

export default App;