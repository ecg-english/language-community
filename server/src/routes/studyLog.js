const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/auth');
const { generateStudyLogResponse, extractLearningTags } = require('../services/openaiService');

// データベース接続設定
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'language_community',
  charset: 'utf8mb4'
};

// 学習ログ投稿の作成
router.post('/channels/:channelId/study-posts', authenticateToken, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const { channelId } = req.params;
    const { content, aiResponseEnabled = false, targetLanguage = 'English', image_url } = req.body;
    const userId = req.user.id;

    // タグの自動抽出
    const tags = await extractLearningTags(content);

    // 学習ログ投稿を作成
    const [result] = await connection.execute(
      `INSERT INTO posts (content, user_id, channel_id, is_study_log, ai_response_enabled, study_tags, target_language, image_url, created_at) 
       VALUES (?, ?, ?, TRUE, ?, ?, ?, ?, NOW())`,
      [content, userId, channelId, aiResponseEnabled, JSON.stringify(tags), targetLanguage, image_url]
    );

    const postId = result.insertId;

    // AI返信が有効な場合は非同期でAI返信を生成
    if (aiResponseEnabled) {
      // 非同期でAI返信を生成（レスポンスを待たない）
      generateAIResponse(postId, content, targetLanguage, connection).catch(error => {
        console.error('AI返信生成エラー:', error);
      });
    }

    // 投稿情報を取得して返す
    const [posts] = await connection.execute(
      `SELECT p.*, u.username, u.avatar_url, 
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = ?`,
      [userId, postId]
    );

    res.json({
      success: true,
      post: posts[0],
      tags: tags
    });

  } catch (error) {
    console.error('学習ログ投稿作成エラー:', error);
    res.status(500).json({ error: '学習ログ投稿の作成に失敗しました' });
  } finally {
    await connection.end();
  }
});

// AI返信を非同期で生成する関数
async function generateAIResponse(postId, content, targetLanguage, connection) {
  try {
    const aiResponse = await generateStudyLogResponse(content, targetLanguage);
    
    // AI返信をデータベースに保存
    await connection.execute(
      `INSERT INTO ai_responses (post_id, content, response_type, target_language, generated_at) 
       VALUES (?, ?, 'study_support', ?, NOW())`,
      [postId, aiResponse.content, targetLanguage]
    );

    console.log(`AI返信が生成されました - Post ID: ${postId}`);
  } catch (error) {
    console.error('AI返信生成エラー:', error);
  }
}

// 投稿のAI返信を取得
router.get('/posts/:postId/ai-response', authenticateToken, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const { postId } = req.params;

    const [responses] = await connection.execute(
      `SELECT * FROM ai_responses WHERE post_id = ? ORDER BY generated_at DESC LIMIT 1`,
      [postId]
    );

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
  } finally {
    await connection.end();
  }
});

// 投稿を保存（マイ単語帳に追加）
router.post('/posts/:postId/save', authenticateToken, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // 既に保存済みかチェック
    const [existing] = await connection.execute(
      `SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?`,
      [userId, postId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: '既に保存済みです' });
    }

    // 投稿を保存
    await connection.execute(
      `INSERT INTO saved_posts (user_id, post_id, saved_at) VALUES (?, ?, NOW())`,
      [userId, postId]
    );

    res.json({
      success: true,
      message: '投稿を保存しました'
    });

  } catch (error) {
    console.error('投稿保存エラー:', error);
    res.status(500).json({ error: '投稿の保存に失敗しました' });
  } finally {
    await connection.end();
  }
});

// 投稿の保存を解除
router.delete('/posts/:postId/save', authenticateToken, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    await connection.execute(
      `DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?`,
      [userId, postId]
    );

    res.json({
      success: true,
      message: '保存を解除しました'
    });

  } catch (error) {
    console.error('保存解除エラー:', error);
    res.status(500).json({ error: '保存の解除に失敗しました' });
  } finally {
    await connection.end();
  }
});

// ユーザーの保存済み投稿を取得
router.get('/saved-posts', authenticateToken, async (req, res) => {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [posts] = await connection.execute(
      `SELECT p.*, u.username, u.avatar_url, sp.saved_at,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
              (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
              (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE sp.user_id = ?
       ORDER BY sp.saved_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), offset]
    );

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
  } finally {
    await connection.end();
  }
});

module.exports = router; 