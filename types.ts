export enum AppTab {
  CONVERSATION = 'conversation',
  SEMANTIC = 'semantic',
  DICTIONARY = 'dictionary',
  VOCABULARY = 'vocabulary',
  NEWS = 'news'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  translation?: string; // Japanese translation for model response
}

export interface DictionaryResult {
  word: string;
  pinyin: string;
  zhuyin: string;
  meaning: string;
  examples: {
    sentence: string;
    translation: string;
  }[];
}

export interface VocabWord {
  id: string;
  chinese: string;
  pinyin: string;
  zhuyin: string;
  japanese: string;
  category: string;
  savedAt?: number;
}

export interface SemanticResult {
  explanation: string;
  differences: string;
  examples: string[];
}

export type Difficulty = 'EASY' | 'MIDDLE' | 'HARD';