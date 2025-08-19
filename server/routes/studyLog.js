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
    console.log('================================');

    // OpenAI APIを一時的に無効化（課金問題のため）
    let tags = [];
    console.log('OpenAI API is temporarily disabled due to quota issues. Skipping tag extraction.');

    // 学習ログ投稿を作成（SQLite型エラーを修正）
    console.log('Creating post in database...');
    
    // Boolean値を数値に変換してSQLiteエラーを回避
    const isStudyLog = 1; // TRUE
    const aiResponseEnabledValue = aiResponseEnabled ? 1 : 0;
    const tagsJson = JSON.stringify(tags);
    const imageUrlValue = image_url || null;
    
    const result = db.prepare(`
      INSERT INTO posts (content, user_id, channel_id, is_study_log, ai_response_enabled, study_tags, target_language, image_url, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(content, userId, channelId, isStudyLog, aiResponseEnabledValue, tagsJson, targetLanguage, imageUrlValue);

    const postId = result.lastInsertRowid;
    console.log('Post created with ID:', postId);

    // AI返信は一時的に無効化
    console.log('AI response generation is temporarily disabled due to OpenAI quota issues');

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
      message: 'Study log posted successfully (AI features temporarily disabled)'
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

// AI返信を非同期で生成する関数（一時的に無効化）
async function generateAIResponse(postId, content, targetLanguage) {
  console.log('AI response generation is temporarily disabled due to OpenAI quota issues');
  return;
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
        aiResponse: null,
        message: 'AI responses are temporarily disabled'
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