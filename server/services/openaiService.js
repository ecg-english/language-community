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
    
    // 学習サポート用の詳細プロンプト
    const prompt = isEnglishLearner ? 
      `以下の英語学習ログに対して、温かい学習サポートを提供してください：

学習内容: "${content}"

以下の形式で返信してください：
🎉 **励ましの言葉**
まずは学習を続けている努力を褒めてください。

📝 **表現の解説**
- 投稿された表現の意味や使い方を説明
- より自然な表現があれば提案
- 発音記号も含めて説明（例：/həˈloʊ/）

💡 **例文**
- 学習した表現を使った2-3個の例文
- 実際の会話で使える場面を含む

📚 **関連表現**
- 類義語や関連する表現のみを箇条書きで記載
- 説明文は含めないでください
- 例：- Let's head out
- 例：- Time to go

日本語で温かく、分かりやすく返信してください。` :
      
      `Please provide comprehensive learning support for this Japanese learning log:

Learning content: "${content}"

Please respond in the following format:
🎉 **Encouragement**
First, praise their effort in continuing to learn.

📝 **Expression Analysis**
- Explain the meaning and usage of the expressions posted
- Suggest more natural expressions if applicable
- Include pronunciation guide if applicable

💡 **Example Sentences**
- 2-3 example sentences using the learned expressions
- Include situations where they can be used in real conversations

📚 **Related Expressions**
- List only synonyms and related expressions in bullet points
- Do not include explanatory text
- Example: - おしゃべり
- Example: - 雑談

Please respond warmly and clearly in English.`;

    console.log('Sending request to OpenAI API...');
    console.log('Using model: gpt-4o-mini');
    console.log('Prompt:', prompt);
    console.log('API Key last 10 chars:', process.env.OPENAI_API_KEY ? '...' + process.env.OPENAI_API_KEY.slice(-10) : 'not set');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: isEnglishLearner ? 
            "あなたは温かく親しみやすい英語学習サポートAIです。学習者のモチベーションを高め、実践的で詳しい学習アドバイスを提供してください。" :
            "You are a warm and friendly Japanese learning support AI. Please boost learners' motivation and provide practical, detailed learning advice."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 600, // より詳細な返信のためにトークン数を増加
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
 * @param {string} userLanguage - ユーザーの学習言語 ('English' or 'Japanese')
 * @returns {Promise<Array>} 抽出されたタグ
 */
async function extractLearningTags(content, userLanguage = 'English') {
  console.log('=== extractLearningTags Start ===');
  console.log('OpenAI client exists:', !!openai);
  console.log('Content:', content);
  console.log('User Language:', userLanguage);
  
  try {
    if (!openai) {
      console.warn('OpenAI client not initialized, skipping tag extraction');
      return [];
    }

    const isEnglishLearner = userLanguage === 'English';
    
    // 学習者言語でのタグ抽出プロンプト
    const prompt = isEnglishLearner ? 
      `この日本語の文から3つのキーワードを英語で抽出: "${content}". JSON形式: {"tags": ["キーワード1", "キーワード2", "キーワード3"]}` :
      `この英語の文から3つのキーワードを日本語で抽出: "${content}". JSON形式: {"tags": ["キーワード1", "キーワード2", "キーワード3"]}`;

    console.log('Extracting tags with OpenAI API...');
    console.log('Prompt:', prompt);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

/**
 * 投稿内容の意味を抽出
 * @param {string} content - 投稿内容
 * @param {string} userLanguage - ユーザーの学習言語 ('English' or 'Japanese')
 * @returns {Promise<string>} 意味の説明
 */
async function extractMeaning(content, userLanguage = 'English') {
  console.log('=== extractMeaning Start ===');
  console.log('OpenAI client exists:', !!openai);
  console.log('Content:', content);
  console.log('User Language:', userLanguage);
  
  try {
    if (!openai) {
      console.warn('OpenAI client not initialized, skipping meaning extraction');
      return '';
    }

    const isEnglishLearner = userLanguage === 'English';
    
    // 学習者言語での意味抽出プロンプト（修正：学習言語と逆の言語で意味を表示）
    const prompt = isEnglishLearner ? 
      `この英語の表現の意味を簡潔に日本語で説明してください: "${content}". 1行で簡潔に答えてください。` :
      `この日本語の表現の意味を簡潔に英語で説明してください: "${content}". 1行で簡潔に答えてください。`;

    console.log('Extracting meaning with OpenAI API...');
    console.log('Prompt:', prompt);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    console.log('Meaning extraction response received');
    console.log('Response usage:', response.usage);
    
    const meaning = response.choices[0].message.content.trim();
    console.log('Extracted meaning:', meaning);
    console.log('=== extractMeaning Success ===');
    
    return meaning;

  } catch (error) {
    console.error('=== extractMeaning Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Full error object:', error);
    
    // 意味抽出エラーは投稿を止めないため、ログのみ出力
    if (error.status === 429) {
      console.log('OpenAI API rate limit reached for meaning extraction, returning empty meaning');
    }
    
    return ''; // エラー時は空文字を返す
  }
}

module.exports = {
  generateStudyLogResponse,
  extractLearningTags,
  extractMeaning
}; 