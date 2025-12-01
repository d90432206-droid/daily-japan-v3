
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DictionaryResult, SemanticResult, VocabWord, Difficulty } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_FLASH = 'gemini-2.5-flash';

// --- Conversation Service ---

export const createConversation = (topic: string) => {
  return ai.chats.create({
    model: MODEL_FLASH,
    config: {
      systemInstruction: `
        あなたは親切で可愛らしい中国語の家庭教師です。
        ユーザー（日本人）と「${topic}」というテーマで会話練習をしてください。
        
        ルール:
        1. **台湾の繁体字中国語（Traditional Chinese, Taiwan）**で返答してください。
        2. 返答のすぐ後に、カッコ書きで日本語訳をつけてください。 (例: 你好！ (こんにちは！))
        3. 相手のレベルに合わせて、優しく、励ますように話してください。
        4. 周杰倫（ジェイ・チョウ）のようなクールで優しい口調を少し意識してください。
      `,
    },
  });
};

export const getNextSentenceHint = async (history: string, topic: string): Promise<string> => {
  const prompt = `
    現在の会話の履歴:
    ${history}
    
    テーマ: ${topic}
    
    ユーザーが次に言うべき自然な中国語（台湾繁体字）のフレーズを3つ提案してください。
    日本語の訳もつけてください。
    JSON形式で出力してください: { "hints": [{"chinese": "...", "japanese": "..."}] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chinese: { type: Type.STRING },
                  japanese: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    if (data.hints && data.hints.length > 0) {
      return data.hints.map((h: any) => `${h.chinese} (${h.japanese})`).join('\n');
    }
    return "ヒントを取得できませんでした。";
  } catch (e) {
    console.error(e);
    return "エラーが発生しました。";
  }
};

export interface SentenceAnalysis {
  isValid: boolean;
  correction?: string;
  meaning: string;
  pronunciation: string; // Bopomofo
  breakdown: {
    word: string;
    bopomofo: string;
    meaning: string;
  }[];
  explanation: string;
}

export const analyzeSentenceStructure = async (sentence: string): Promise<SentenceAnalysis> => {
  const prompt = `
    ユーザーが入力した中国語の文章「${sentence}」を分析してください。
    台湾の繁体字と注音符号（Bopomofo）を基準にします。

    以下の情報をJSONで返してください：
    1. isValid: 文法的に自然で正しいかどうか (true/false)
    2. correction: もし不自然なら、より自然な台湾華語の表現（なければnull）
    3. meaning: 日本語の意味
    4. pronunciation: 全体の注音符号
    5. breakdown: 各単語ごとの分解（単語、注音、意味）
    6. explanation: 文法や使い方のポイントを日本語で詳しく解説（ジェイ・チョウ風の口調で）
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      isValid: { type: Type.BOOLEAN },
      correction: { type: Type.STRING, nullable: true },
      meaning: { type: Type.STRING },
      pronunciation: { type: Type.STRING },
      breakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            bopomofo: { type: Type.STRING },
            meaning: { type: Type.STRING }
          }
        }
      },
      explanation: { type: Type.STRING }
    },
    required: ["isValid", "meaning", "pronunciation", "breakdown", "explanation"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || '{}') as SentenceAnalysis;
};

// --- Semantic Comparison Service ---

export const analyzeSemanticDifference = async (query: string): Promise<SemanticResult> => {
  const prompt = `
    ユーザーが入力した以下の日中/中日に関連する言葉や文章について、意味の違いやニュアンスを詳しく、分かりやすく**日本語**で解説してください。
    中国語は**台湾繁体字**を使用してください。
    入力: "${query}"
    
    もし入力が単語一つの場合は、それに関連する類義語との違いを説明してください。
    **解説文は必ず日本語で出力してください。**
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      explanation: { type: Type.STRING, description: "Main explanation of the meaning in Japanese" },
      differences: { type: Type.STRING, description: "Detailed nuance differences in Japanese" },
      examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Example sentences showing the difference" }
    },
    required: ["explanation", "differences", "examples"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || '{}') as SemanticResult;
};

// --- Dictionary Service ---

export const searchDictionary = async (query: string): Promise<DictionaryResult> => {
  const prompt = `
    日中・中日辞書として振る舞ってください。
    入力: "${query}"
    
    入力が日本語なら中国語訳（台湾繁体字）を、中国語なら日本語訳を提供してください。
    **必ず注音符号（Bopomofo）とPinyinの両方**を含めてください。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      pinyin: { type: Type.STRING },
      zhuyin: { type: Type.STRING, description: "Bopomofo pronunciation" },
      meaning: { type: Type.STRING },
      examples: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING },
            translation: { type: Type.STRING }
          }
        }
      }
    },
    required: ["word", "pinyin", "zhuyin", "meaning", "examples"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || '{}') as DictionaryResult;
};

// --- Vocabulary Service ---

export const generateVocabulary = async (category: string, difficulty: Difficulty, excludeWords: string[] = []): Promise<VocabWord[]> => {
  let difficultyDesc = "";
  
  if (difficulty === 'EASY') {
    difficultyDesc = "【超・初心者向け (HSK 1-2級)】。「水」「食べる」「これ」「行く」など、生活に必須の最も基本的で短い単語のみ。熟語は避けてください。";
  } else if (difficulty === 'MIDDLE') {
    difficultyDesc = "【中級者向け (HSK 3-4級)】。日常会話を豊かにするための表現。「節約」「誤解」「調整」「雰囲気」など、2文字以上の動詞・名詞・形容詞を中心にして、基礎単語は一切含めないでください。";
  } else if (difficulty === 'HARD') {
    difficultyDesc = "【上級者・ニュース向け (HSK 5-6級)】。新聞、ニュース、ビジネスで使われる硬い表現や四字熟語、抽象的な概念を選んでください。口語表現は避けてください。";
  }

  const prompt = `
    「${category}」というカテゴリに関連する中国語単語を10個生成してください。
    難易度指定: ${difficultyDesc}
    
    **重要ルール**:
    1. 中国語は**台湾繁体字**を使用してください。
    2. **注音符号（Bopomofo）**を含めてください。
    3. 以下の単語は**絶対に出力しないでください**（重複防止のため）:
       [${excludeWords.join(', ')}]
       
    4. 指定された難易度（${difficulty}）を厳密に守ってください。EASYとMIDDLEの差を明確にしてください。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      words: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            chinese: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            zhuyin: { type: Type.STRING },
            japanese: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["chinese", "pinyin", "zhuyin", "japanese"]
        }
      }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const data = JSON.parse(response.text || '{}');
  // Add IDs locally
  return data.words.map((w: any) => ({
    ...w,
    id: Math.random().toString(36).substring(7),
    category: category
  }));
};

// --- News Service ---

export const getWeeklyNews = async () => {
  const prompt = `
    今週、台湾や中華圏で話題になった興味深いニュースを検索してください。
    日本語で学習するのに適した、ポジティブまたは文化的なニュースを3つ選んでください。
    
    各ニュースについて以下のようにまとめてください：
    1. タイトル（台湾繁体字）
    2. 日本語の要約
    3. 学習ポイント（キーワードや表現）
    
    Markdown形式で見やすく整形して出力してください。
    記事の元リンク(URL)も必ず引用して表示してください。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FLASH, // Use standard flash for tools
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    content: response.text || "ニュースを取得できませんでした。",
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
};
