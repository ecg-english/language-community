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
    const userId = req.user.id;

    console.log('=== Study Log Post Request ===');
    console.log('Channel ID:', channelId);
    console.log('Content:', content);
    console.log('AI Response Enabled:', aiResponseEnabled);
    console.log('Target Language:', targetLanguage);
    console.log('User ID:', userId);
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('================================');

    // タグの自動抽出（エラーが発生しても投稿は続行）
    let tags = [];
    try {
      if (process.env.OPENAI_API_KEY) {
        tags = await extractLearningTags(content);
        console.log('Extracted tags:', tags);
      } else {
        console.log('OpenAI API key not set, skipping tag extraction');
      }
    } catch (tagError) {
      console.error('Tag extraction failed, continuing without tags:', tagError);
      tags = [];
    }

    // 学習ログ投稿を作成
    const result = db.prepare(`
      INSERT INTO posts (content, user_id, channel_id, is_study_log, ai_response_enabled, study_tags, target_language, image_url, created_at) 
      VALUES (?, ?, ?, TRUE, ?, ?, ?, ?, datetime('now'))
    `).run(content, userId, channelId, aiResponseEnabled, JSON.stringify(tags), targetLanguage, image_url);

    const postId = result.lastInsertRowid;
    console.log('Post created with ID:', postId);

    // AI返信が有効な場合で、OpenAI APIキーが設定されている場合のみAI返信を生成
    if (aiResponseEnabled && process.env.OPENAI_API_KEY) {
      console.log('Generating AI response...');
      // 非同期でAI返信を生成（レスポンスを待たない）
      generateAIResponse(postId, content, targetLanguage).catch(error => {
        console.error('AI返信生成エラー:', error);
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
    `).all(userId, postId);

    console.log('Post retrieved successfully');
    console.log('=== Study Log Post Response ===');
    console.log('Success:', true);
    console.log('Post ID:', posts[0]?.id);
    console.log('Tags:', tags);
    console.log('================================');

    res.json({
      success: true,
      post: posts[0],
      tags: tags
    });

  } catch (error) {
    console.error('学習ログ投稿作成エラー:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: '学習ログ投稿の作成に失敗しました',
      details: error.message 
    });
  }
});

// AI返信を非同期で生成する関数
async function generateAIResponse(postId, content, targetLanguage) {
  try {
    const aiResponse = await generateStudyLogResponse(content, targetLanguage);
    
    // AI返信をデータベースに保存
    db.prepare(`
      INSERT INTO ai_responses (post_id, content, response_type, target_language, generated_at) 
      VALUES (?, ?, 'study_support', ?, datetime('now'))
    `).run(postId, aiResponse.content, targetLanguage);

    console.log(`AI返信が生成されました - Post ID: ${postId}`);
  } catch (error) {
    console.error('AI返信生成エラー:', error);
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

    // 既に保存済みかチェック
    const existing = db.prepare(`
      SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?
    `).get(userId, postId);

    if (existing) {
      return res.status(400).json({ error: '既に保存済みです' });
    }

    // 投稿を保存
    db.prepare(`
      INSERT INTO saved_posts (user_id, post_id, saved_at) VALUES (?, ?, datetime('now'))
    `).run(userId, postId);

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

    db.prepare(`
      DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?
    `).run(userId, postId);

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
    const offset = (page - 1) * limit;

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
    `).all(userId, userId, parseInt(limit), offset);

    res.json({
      success: true,
      posts: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length
      }
    });

  } catch (error) {
    console.error('保存済み投稿取得エラー:', error);
    res.status(500).json({ error: '保存済み投稿の取得に失敗しました' });
  }
});

module.exports = router; 