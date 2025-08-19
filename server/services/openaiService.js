const OpenAI = require('openai');

// OpenAIクライアントの初期化（環境変数から読み込み）
let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
  } else {
    console.warn('OpenAI API キーが設定されていません。AI機能は無効になります。');
  }
} catch (error) {
  console.error('OpenAI client initialization failed:', error);
}

/**
 * 学習ログ投稿に対するAI返信を生成
 * @param {string} content - 投稿内容
 * @param {string} userLanguage - ユーザーの学習言語 ('English' or 'Japanese')
 * @returns {Promise<Object>} AI返信データ
 */
async function generateStudyLogResponse(content, userLanguage = 'English') {
  try {
    if (!openai) {
      throw new Error('OpenAI API キーが設定されていません');
    }

    const isEnglishLearner = userLanguage === 'English';
    
    // フリーティア制限を考慮した短縮プロンプト
    const prompt = isEnglishLearner ? 
      `以下の日本語学習ログに温かい励ましと簡単なアドバイスをください：
"${content}"

簡潔に日本語で返信してください。` :
      
      `Please provide warm encouragement and simple advice for this Japanese learning log:
"${content}"

Please respond briefly in English.`;

    console.log('Sending request to OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // フリーティア対応モデルに変更
      messages: [
        {
          role: "system",
          content: isEnglishLearner ? 
            "あなたは親しみやすい学習サポートAIです。簡潔に返信してください。" :
            "You are a friendly learning support AI. Please respond briefly."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 200, // トークン数を大幅に削減
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content;
    console.log('OpenAI API response received successfully');

    // レスポンスを構造化して返す
    return {
      content: aiResponse,
      type: 'ai_response',
      generated_at: new Date().toISOString(),
      target_language: userLanguage
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // フリーティア制限エラーの場合の特別処理
    if (error.status === 429) {
      throw new Error('OpenAI APIの利用制限に達しました。しばらく待ってから再試行してください。');
    }
    
    throw new Error('AI返信の生成に失敗しました: ' + error.message);
  }
}

/**
 * 投稿内容から学習タグを自動抽出
 * @param {string} content - 投稿内容
 * @returns {Promise<Array>} 抽出されたタグ
 */
async function extractLearningTags(content) {
  try {
    if (!openai) {
      console.warn('OpenAI API キーが設定されていません。タグ抽出をスキップします。');
      return [];
    }

    // フリーティア制限を考慮した短縮プロンプト
    const prompt = `学習ログから3個のタグを抽出してください：
"${content}"

JSON形式で返してください: {"tags": ["タグ1", "タグ2", "タグ3"]}`;

    console.log('Extracting tags with OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // フリーティア対応モデルに変更
      messages: [
        {
          role: "system",
          content: "学習タグを抽出するAIです。簡潔に返してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100, // トークン数を大幅に削減
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('Tags extracted successfully:', result.tags);
    return result.tags || [];

  } catch (error) {
    console.error('Tag extraction error:', error);
    
    // フリーティア制限エラーの場合の特別処理
    if (error.status === 429) {
      console.log('OpenAI API rate limit reached for tag extraction, returning empty tags');
      return [];
    }
    
    return []; // エラー時は空配列を返す
  }
}

module.exports = {
  generateStudyLogResponse,
  extractLearningTags
}; 