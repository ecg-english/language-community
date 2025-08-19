const OpenAI = require('openai');

// 詳細な環境変数デバッグ
console.log('=== OpenAI Service Initialization Debug ===');
console.log('process.env.OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false);
console.log('OPENAI_API_KEY first 20 chars:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'not set');
console.log('============================================');

// OpenAIクライアントの初期化（環境変数から読み込み）
let openai = null;

try {
  if (process.env.OPENAI_API_KEY) {
    console.log('Attempting to initialize OpenAI client...');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI client initialized successfully');
    
    // 初期化テスト
    console.log('Testing OpenAI client initialization...');
    console.log('OpenAI client object created:', !!openai);
  } else {
    console.warn('OpenAI API キーが設定されていません。AI機能は無効になります。');
  }
} catch (error) {
  console.error('OpenAI client initialization failed:', error);
  console.error('Error details:', error.message);
  console.error('Error stack:', error.stack);
}

/**
 * 学習ログ投稿に対するAI返信を生成
 * @param {string} content - 投稿内容
 * @param {string} userLanguage - ユーザーの学習言語 ('English' or 'Japanese')
 * @returns {Promise<Object>} AI返信データ
 */
async function generateStudyLogResponse(content, userLanguage = 'English') {
  console.log('=== generateStudyLogResponse Start ===');
  console.log('OpenAI client exists:', !!openai);
  console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
  console.log('Content:', content);
  console.log('User Language:', userLanguage);
  
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized - API key may be missing');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API キーが設定されていません');
    }

    const isEnglishLearner = userLanguage === 'English';
    
    // 最もシンプルなプロンプトでテスト
    const prompt = isEnglishLearner ? 
      `この学習ログに短い励ましの言葉をください: "${content}"` :
      `Please give a short encouraging message for this learning log: "${content}"`;

    console.log('Sending request to OpenAI API...');
    console.log('Using model: gpt-3.5-turbo');
    console.log('Prompt:', prompt);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    console.log('OpenAI API response received successfully');
    console.log('Response usage:', response.usage);
    
    const aiResponse = response.choices[0].message.content;
    console.log('AI response content:', aiResponse);

    // レスポンスを構造化して返す
    const result = {
      content: aiResponse,
      type: 'ai_response',
      generated_at: new Date().toISOString(),
      target_language: userLanguage
    };
    
    console.log('=== generateStudyLogResponse Success ===');
    return result;

  } catch (error) {
    console.error('=== generateStudyLogResponse Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Error code:', error.code);
    console.error('Full error object:', error);
    
    // より詳細なエラー分析
    if (error.status === 429) {
      console.error('Rate limit error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        headers: error.headers
      });
      throw new Error('OpenAI APIの利用制限に達しました。しばらく待ってから再試行してください。');
    } else if (error.status === 401) {
      console.error('Authentication error - API key may be invalid');
      throw new Error('OpenAI APIキーが無効です。APIキーを確認してください。');
    } else if (error.status === 403) {
      console.error('Permission error - API key may not have required permissions');
      throw new Error('OpenAI APIの使用権限がありません。');
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
  console.log('=== extractLearningTags Start ===');
  console.log('OpenAI client exists:', !!openai);
  console.log('Content:', content);
  
  try {
    if (!openai) {
      console.warn('OpenAI client not initialized, skipping tag extraction');
      return [];
    }

    // 最もシンプルなプロンプトでテスト
    const prompt = `この文から3つのキーワードを抽出: "${content}". JSON形式: {"tags": ["キーワード1", "キーワード2", "キーワード3"]}`;

    console.log('Extracting tags with OpenAI API...');
    console.log('Prompt:', prompt);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 80,
      temperature: 0.3,
    });

    console.log('Tag extraction response received');
    console.log('Response usage:', response.usage);
    
    const responseContent = response.choices[0].message.content;
    console.log('Raw response:', responseContent);
    
    const result = JSON.parse(responseContent);
    console.log('Parsed tags:', result.tags);
    console.log('=== extractLearningTags Success ===');
    
    return result.tags || [];

  } catch (error) {
    console.error('=== extractLearningTags Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Full error object:', error);
    
    // タグ抽出エラーは投稿を止めないため、ログのみ出力
    if (error.status === 429) {
      console.log('OpenAI API rate limit reached for tag extraction, returning empty tags');
    }
    
    return []; // エラー時は空配列を返す
  }
}

module.exports = {
  generateStudyLogResponse,
  extractLearningTags
}; 