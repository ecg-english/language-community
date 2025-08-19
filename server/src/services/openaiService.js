const OpenAI = require('openai');

// OpenAIクライアントの初期化（環境変数から読み込み）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 学習ログ投稿に対するAI返信を生成
 * @param {string} content - 投稿内容
 * @param {string} userLanguage - ユーザーの学習言語 ('English' or 'Japanese')
 * @returns {Promise<Object>} AI返信データ
 */
async function generateStudyLogResponse(content, userLanguage = 'English') {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API キーが設定されていません');
    }

    const isEnglishLearner = userLanguage === 'English';
    const prompt = isEnglishLearner ? 
      `あなたは温かく親しみやすい英語学習サポートAIです。以下の学習ログに対して、励ましの言葉と共に以下の項目で返信してください：

投稿内容: "${content}"

返信形式：
1. 励ましの言葉（親しみやすく温かい口調で）
2. 表現チェック（誤りがあれば優しく訂正）
3. 追加例文（投稿された表現を使った別の例文）
4. 関連表現（類義語や関連フレーズ、例文付き）

※機械的にならず、まるで友達のような温かい返信をしてください。日本語で返信してください。` :
      
      `You are a warm and friendly Japanese learning support AI. Please respond to the following study log with encouragement and the following items:

Post content: "${content}"

Response format:
1. Encouraging words (in a friendly and warm tone)
2. Expression check (gently correct if there are errors)
3. Additional examples (other example sentences using the posted expressions)
4. Related expressions (synonyms or related phrases with examples)

※Please make your response warm and friendly, like a friend. Please respond in English.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: isEnglishLearner ? 
            "あなたは英語学習者をサポートする優しく親しみやすいAIアシスタントです。学習者のモチベーションを高め、温かくサポートしてください。" :
            "You are a kind and friendly AI assistant supporting Japanese learners. Please boost learners' motivation and provide warm support."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content;

    // レスポンスを構造化して返す
    return {
      content: aiResponse,
      type: 'ai_response',
      generated_at: new Date().toISOString(),
      target_language: userLanguage
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('AI返信の生成に失敗しました');
  }
}

/**
 * 投稿内容から学習タグを自動抽出
 * @param {string} content - 投稿内容
 * @returns {Promise<Array>} 抽出されたタグ
 */
async function extractLearningTags(content) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API キーが設定されていません。タグ抽出をスキップします。');
      return [];
    }

    const prompt = `以下の学習ログから適切なタグを3-5個抽出してください。タグは学習内容を表すキーワードにしてください。

投稿内容: "${content}"

以下の形式で返してください（JSON形式）：
{
  "tags": ["タグ1", "タグ2", "タグ3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは学習ログからタグを抽出する専門AIです。学習内容に関連する適切なタグを抽出してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.tags || [];

  } catch (error) {
    console.error('Tag extraction error:', error);
    return []; // エラー時は空配列を返す
  }
}

module.exports = {
  generateStudyLogResponse,
  extractLearningTags
}; 