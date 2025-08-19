const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateStudyLogResponse, extractLearningTags } = require('../services/openaiService');

// データベース接続（SQLiteを使用）
const db = require('../database');

// 学習ログ投稿の作成
router.post('/channels/:channelId/study-posts', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, aiResponseEnabled = false, targetLanguage = 'English', image_url } = req.body;
    
    console.log('=== Study Log Post Request ===');
    console.log('Channel ID:', channelId);
    console.log('Content:', content);
    console.log('AI Response Enabled:', aiResponseEnabled);
    console.log('Target Language:', targetLanguage);
    console.log('Raw req.user object:', JSON.stringify(req.user, null, 2));
    console.log('req.user exists:', !!req.user);
    console.log('req.user.userId:', req.user ? req.user.userId : 'undefined');
    console.log('req.user.id:', req.user ? req.user.id : 'undefined');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('================================');

    // ユーザーIDの堅牢な取得と検証
    let userId = null;
    
    if (req.user) {
      userId = req.user.userId || req.user.id;
      console.log('User ID resolution attempt 1:', userId);
      
      // 追加の検証：ユーザー情報を直接データベースから取得
      if (!userId && req.user.username) {
        console.log('Attempting to get user ID from username:', req.user.username);
        const userFromDb = db.prepare('SELECT id FROM users WHERE username = ?').get(req.user.username);
        if (userFromDb) {
          userId = userFromDb.id;
          console.log('User ID from database lookup:', userId);
        }
      }
    }

    console.log('Final resolved User ID:', userId);
    console.log('User ID type:', typeof userId);

    // ユーザーIDの最終検証
    if (!userId || isNaN(parseInt(userId))) {
      console.error('User ID validation failed');
      console.error('req.user full object:', req.user);
      throw new Error('有効なユーザーIDが取得できませんでした。再ログインしてください。');
    }

    // 数値型に変換
    const userIdNum = parseInt(userId);
    console.log('Converted User ID to number:', userIdNum);

    // タグの自動抽出（OpenAI APIエラーを完全に処理）
    let tags = [];
    if (aiResponseEnabled) {
      try {
        if (process.env.OPENAI_API_KEY) {
          console.log('Attempting to extract tags...');
          tags = await extractLearningTags(content);
          console.log('Extracted tags:', tags);
        } else {
          console.log('Skipping tag extraction - API key not set');
        }
      } catch (tagError) {
        console.error('Tag extraction failed, continuing without tags:', tagError.message);
        // OpenAI APIエラーでも投稿は続行
        tags = [];
      }
    }

    // 学習ログ投稿を作成（SQLite型エラーを修正）
    console.log('Creating post in database...');
    console.log('Database parameters:', {
      content: content,
      user_id: userIdNum,
      channel_id: parseInt(channelId),
      is_study_log: 1,
      ai_response_enabled: aiResponseEnabled ? 1 : 0,
      study_tags: JSON.stringify(tags),
      target_language: targetLanguage,
      image_url: image_url || null
    });
    
    const result = db.prepare(`
      INSERT INTO posts (content, user_id, channel_id, is_study_log, ai_response_enabled, study_tags, target_language, image_url, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      content, 
      userIdNum, 
      parseInt(channelId), 
      1, // is_study_log = TRUE
      aiResponseEnabled ? 1 : 0, // ai_response_enabled
      JSON.stringify(tags), 
      targetLanguage, 
      image_url || null
    );

    const postId = result.lastInsertRowid;
    console.log('Post created with ID:', postId);

    // AI返信が有効な場合で、OpenAI APIキーが設定されている場合のみAI返信を生成
    if (aiResponseEnabled && process.env.OPENAI_API_KEY) {
      console.log('Generating AI response...');
      // 非同期でAI返信を生成（エラーが発生しても投稿は成功扱い）
      generateAIResponse(postId, content, targetLanguage).catch(error => {
        console.error('AI返信生成エラー:', error.message);
        console.log('AI response generation failed, but post was created successfully');
      });
    } else if (aiResponseEnabled && !process.env.OPENAI_API_KEY) {
      console.log('AI response requested but OpenAI API key not set');
    }

    // 投稿情報を取得して返す
    console.log('Retrieving post data...');
    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url, 
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `).all(userIdNum, postId);

    if (posts.length === 0) {
      throw new Error('投稿の取得に失敗しました');
    }

    console.log('Post retrieved successfully');
    console.log('=== Study Log Post Response ===');
    console.log('Success:', true);
    console.log('Post ID:', posts[0].id);
    console.log('Tags:', tags);
    console.log('================================');

    res.json({
      success: true,
      post: posts[0],
      tags: tags,
      aiEnabled: aiResponseEnabled && !!process.env.OPENAI_API_KEY,
      message: 'Study log posted successfully!'
    });

  } catch (error) {
    console.error('学習ログ投稿作成エラー:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({ 
      error: '学習ログ投稿の作成に失敗しました',
      details: error.message 
    });
  }
});

// AI返信を非同期で生成する関数
async function generateAIResponse(postId, content, targetLanguage) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not set, skipping AI response generation');
      return;
    }

    console.log(`Generating AI response for post ${postId}...`);
    const aiResponse = await generateStudyLogResponse(content, targetLanguage);
    
    // AI返信をデータベースに保存
    db.prepare(`
      INSERT INTO ai_responses (post_id, content, response_type, target_language, generated_at) 
      VALUES (?, ?, 'study_support', ?, datetime('now'))
    `).run(postId, aiResponse.content, targetLanguage);

    console.log(`AI返信が生成されました - Post ID: ${postId}`);
  } catch (error) {
    console.error('AI返信生成エラー:', error);
    console.log('AI response generation failed for post:', postId);
  }
}

// 投稿のAI返信を取得
router.get('/posts/:postId/ai-response', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const responses = db.prepare(`
      SELECT * FROM ai_responses WHERE post_id = ? ORDER BY generated_at DESC LIMIT 1
    `).all(postId);

    if (responses.length > 0) {
      res.json({
        success: true,
        aiResponse: responses[0]
      });
    } else {
      res.json({
        success: true,
        aiResponse: null
      });
    }

  } catch (error) {
    console.error('AI返信取得エラー:', error);
    res.status(500).json({ error: 'AI返信の取得に失敗しました' });
  }
});

// 投稿を保存（マイ単語帳に追加）
router.post('/posts/:postId/save', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // postIdとuserIdを数値に変換
    const postIdNum = parseInt(postId);
    const userIdNum = parseInt(userId);

    // 既に保存済みかチェック
    const existing = db.prepare(`
      SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?
    `).get(userIdNum, postIdNum);

    if (existing) {
      return res.status(400).json({ error: '既に保存済みです' });
    }

    // 投稿を保存
    db.prepare(`
      INSERT INTO saved_posts (user_id, post_id, saved_at) VALUES (?, ?, datetime('now'))
    `).run(userIdNum, postIdNum);

    res.json({
      success: true,
      message: '投稿を保存しました'
    });

  } catch (error) {
    console.error('投稿保存エラー:', error);
    res.status(500).json({ error: '投稿の保存に失敗しました' });
  }
});

// 投稿の保存を解除
router.delete('/posts/:postId/save', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // postIdとuserIdを数値に変換
    const postIdNum = parseInt(postId);
    const userIdNum = parseInt(userId);

    db.prepare(`
      DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?
    `).run(userIdNum, postIdNum);

    res.json({
      success: true,
      message: '保存を解除しました'
    });

  } catch (error) {
    console.error('保存解除エラー:', error);
    res.status(500).json({ error: '保存の解除に失敗しました' });
  }
});

// ユーザーの保存済み投稿を取得
router.get('/saved-posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    // 数値に変換
    const userIdNum = parseInt(userId);
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;

    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url, sp.saved_at,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE sp.user_id = ?
      ORDER BY sp.saved_at DESC
      LIMIT ? OFFSET ?
    `).all(userIdNum, userIdNum, limitNum, offset);

    res.json({
      success: true,
      posts: posts,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: posts.length
      }
    });

  } catch (error) {
    console.error('保存済み投稿取得エラー:', error);
    res.status(500).json({ error: '保存済み投稿の取得に失敗しました' });
  }
});

module.exports = router; 