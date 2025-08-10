const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../database');
const { authenticateToken, checkChannelViewPermission, checkChannelPostPermission } = require('../middleware/auth');

// チャンネルの投稿一覧を取得
router.get('/channels/:channelId/posts', authenticateToken, checkChannelViewPermission, (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const posts = db.prepare(`
      SELECT 
        p.*,
        u.username,
        u.role,
        u.avatar_url,
        e.event_date,
        e.start_time,
        e.end_time,
        e.location,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) as user_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.channel_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.userId, channelId, limit, offset);

    // アバターURLを修正
    posts.forEach(post => {
      if (post.avatar_url && post.avatar_url.includes('ecg-english.github.io')) {
        const fileName = post.avatar_url.split('/').pop();
        post.avatar_url = `${process.env.NODE_ENV === 'production' 
          ? 'https://language-community-backend.onrender.com' 
          : 'http://localhost:3001'}/uploads/${fileName}`;
      }
    });

    res.json({ posts });
  } catch (error) {
    console.error('投稿取得エラー:', error);
    res.status(500).json({ error: '投稿の取得に失敗しました' });
  }
});

// 特定のユーザーの投稿一覧を取得
router.get('/user/:userId', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const posts = db.prepare(`
      SELECT 
        p.*,
        u.username,
        u.role,
        u.avatar_url,
        c.name as channel_name,
        cat.name as category_name,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments com WHERE com.post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN channels c ON p.channel_id = c.id
      JOIN categories cat ON c.category_id = cat.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    res.json({ posts });
  } catch (error) {
    console.error('ユーザー投稿取得エラー:', error);
    res.status(500).json({ error: 'ユーザーの投稿取得に失敗しました' });
  }
});

// 投稿を作成
router.post('/channels/:channelId/posts', authenticateToken, (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, image_url, is_anonymous, question_type, original_user_id, original_username } = req.body;
    const userId = req.user.userId;

    // 権限チェックをバイパスするフラグがある場合はスキップ
    if (!req.headers['x-bypass-permission']) {
      // 通常の権限チェック
      const channel = db.prepare('SELECT channel_type FROM channels WHERE id = ?').get(channelId);
      if (!channel) {
        return res.status(404).json({ error: 'チャンネルが見つかりません' });
      }

      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }

      // 投稿権限をチェック
      if (user.role === 'Trial参加者') {
        return res.status(403).json({ error: '投稿権限がありません' });
      }

      if (channel.channel_type === 'admin_only_all_view' || channel.channel_type === 'admin_only_instructors_view') {
        if (!['サーバー管理者', 'ECG講師', 'JCG講師'].includes(user.role)) {
          return res.status(403).json({ error: '投稿権限がありません' });
        }
      }
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: '投稿内容を入力してください' });
    }

    const insertPost = db.prepare(`
      INSERT INTO posts (content, user_id, channel_id, image_url, is_anonymous, question_type, original_user_id, original_username) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertPost.run(
      content.trim(), 
      userId, 
      channelId, 
      image_url || null,
      is_anonymous || false,
      question_type || null,
      original_user_id || null,
      original_username || null
    );

    // 作成された投稿を取得
    const newPost = db.prepare(`
      SELECT 
        p.*,
        u.username,
        u.role,
        u.avatar_url,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
        0 as user_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: '投稿が作成されました',
      post: newPost
    });
  } catch (error) {
    console.error('投稿作成エラー:', error);
    res.status(500).json({ error: '投稿の作成に失敗しました' });
  }
});

// 投稿を削除
router.delete('/posts/:postId', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // 投稿の所有者または管理者のみ削除可能
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(postId);
    
    if (!post) {
      return res.status(404).json({ error: '投稿が見つかりません' });
    }

    if (post.user_id !== userId && req.user.role !== 'サーバー管理者') {
      return res.status(403).json({ error: '投稿を削除する権限がありません' });
    }

    const deletePost = db.prepare('DELETE FROM posts WHERE id = ?');
    const result = deletePost.run(postId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '投稿が見つかりません' });
    }

    res.json({ message: '投稿が削除されました' });
  } catch (error) {
    console.error('投稿削除エラー:', error);
    res.status(500).json({ error: '投稿の削除に失敗しました' });
  }
});

// いいね/いいね解除
router.post('/posts/:postId/like', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // 既存のいいねをチェック
    const existingLike = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').get(userId, postId);

    if (existingLike) {
      // いいね解除
      const deleteLike = db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?');
      deleteLike.run(userId, postId);
      
      res.json({ message: 'いいねを解除しました', liked: false });
    } else {
      // いいね追加
      const insertLike = db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)');
      insertLike.run(userId, postId);
      
      res.json({ message: 'いいねしました', liked: true });
    }
  } catch (error) {
    console.error('いいねエラー:', error);
    res.status(500).json({ error: 'いいねの処理に失敗しました' });
  }
});

// コメント一覧を取得
router.get('/posts/:postId/comments', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;

    const comments = db.prepare(`
      SELECT 
        c.*,
        u.username,
        u.role,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId);

    // アバターURLを修正
    comments.forEach(comment => {
      if (comment.avatar_url && comment.avatar_url.includes('ecg-english.github.io')) {
        const fileName = comment.avatar_url.split('/').pop();
        comment.avatar_url = `${process.env.NODE_ENV === 'production' 
          ? 'https://language-community-backend.onrender.com' 
          : 'http://localhost:3001'}/uploads/${fileName}`;
      }
    });

    res.json({ comments });
  } catch (error) {
    console.error('コメント取得エラー:', error);
    res.status(500).json({ error: 'コメントの取得に失敗しました' });
  }
});

// コメントを作成
router.post('/posts/:postId/comments', authenticateToken, (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'コメント内容を入力してください' });
    }

    const insertComment = db.prepare(`
      INSERT INTO comments (content, user_id, post_id) 
      VALUES (?, ?, ?)
    `);
    
    const result = insertComment.run(content.trim(), userId, postId);

    // 作成されたコメントを取得
    const newComment = db.prepare(`
      SELECT 
        c.*,
        u.username,
        u.role,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'コメントが作成されました',
      comment: newComment
    });
  } catch (error) {
    console.error('コメント作成エラー:', error);
    res.status(500).json({ error: 'コメントの作成に失敗しました' });
  }
});

// コメントを削除
router.delete('/comments/:commentId', authenticateToken, (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // コメントの所有者または管理者のみ削除可能
    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'コメントが見つかりません' });
    }

    if (comment.user_id !== userId && req.user.role !== 'サーバー管理者') {
      return res.status(403).json({ error: 'コメントを削除する権限がありません' });
    }

    const deleteComment = db.prepare('DELETE FROM comments WHERE id = ?');
    const result = deleteComment.run(commentId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'コメントが見つかりません' });
    }

    res.json({ message: 'コメントが削除されました' });
  } catch (error) {
    console.error('コメント削除エラー:', error);
    res.status(500).json({ error: 'コメントの削除に失敗しました' });
  }
});

// テスト投稿を削除（管理者のみ）
router.delete('/cleanup-test-posts', authenticateToken, (req, res) => {
  try {
    const userRole = req.user.role;

    // 管理者のみ実行可能
    if (userRole !== 'サーバー管理者') {
      return res.status(403).json({ error: 'テスト投稿削除の権限がありません' });
    }

    // テスト投稿を削除
    const deleteTestPosts = db.prepare(`
      DELETE FROM posts 
      WHERE content IN ('テストイベント2', 'TESTTESTAAA')
    `);
    
    const result = deleteTestPosts.run();
    
    console.log('テスト投稿削除結果:', result);
    
    res.json({ 
      message: 'テスト投稿が削除されました',
      deletedCount: result.changes
    });
  } catch (error) {
    console.error('テスト投稿削除エラー:', error);
    res.status(500).json({ error: 'テスト投稿の削除に失敗しました' });
  }
});

// 画像アップロード
router.post('/upload/image', authenticateToken, (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: '画像データが提供されていません' });
    }

    // Base64データをデコードしてバリデーション
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // ファイルサイズチェック（5MB制限）
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: '画像サイズは5MB以下にしてください' });
    }

    // 画像形式チェック
    const header = buffer.toString('hex', 0, 4);
    const validFormats = ['89504e47', 'ffd8ffdb', 'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'];
    
    if (!validFormats.some(format => header.startsWith(format))) {
      return res.status(400).json({ error: '対応していない画像形式です。PNG、JPEG形式のみ対応しています' });
    }

    // 画像を保存（Renderの永続化ディスクを使用）
    const fileName = `post_image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    let uploadsDir;
    
    if (process.env.NODE_ENV === 'production') {
      // Renderの永続化ディスクを使用
      uploadsDir = '/opt/render/data/uploads';
    } else {
      // 開発環境
      uploadsDir = path.join(__dirname, '../uploads');
    }
    
    const filePath = path.join(uploadsDir, fileName);
    
    // uploadsディレクトリが存在しない場合は作成
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, buffer);
    
    // 画像URLを返す（バックエンドのURLを含む）
    const backendUrl = process.env.BACKEND_URL || 'https://language-community-backend.onrender.com';
    const imageUrl = `${backendUrl}/uploads/${fileName}`;
    
    res.json({
      message: '画像がアップロードされました',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ error: '画像のアップロードに失敗しました' });
  }
});

module.exports = router; 