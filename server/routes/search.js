const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 検索エンドポイント
router.get('/', authenticateToken, (req, res) => {
  const { q: query, type } = req.query;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: '検索クエリが必要です' });
  }

  const searchTerm = `%${query.trim()}%`;

  try {
    let results = {
      posts: [],
      users: [],
      channels: []
    };

    // 投稿を検索（投稿内容で検索）
    if (!type || type === 'posts') {
      const postsQuery = `
        SELECT 
          p.*,
          u.username,
          u.role,
          c.name as channel_name,
          cat.name as category_name,
          (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments com WHERE com.post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN channels c ON p.channel_id = c.id
        JOIN categories cat ON c.category_id = cat.id
        WHERE p.content LIKE ?
        ORDER BY p.created_at DESC
        LIMIT 20
      `;
      
      const posts = db.prepare(postsQuery).all(searchTerm);
      results.posts = posts;
    }

    // ユーザーを検索（ユーザー名で検索）
    if (!type || type === 'users') {
      const usersQuery = `
        SELECT 
          id,
          username,
          email,
          role,
          bio,
          avatar_url,
          created_at
        FROM users
        WHERE username LIKE ?
        ORDER BY username
        LIMIT 20
      `;
      
      const users = db.prepare(usersQuery).all(searchTerm);
      results.users = users;
    }

    // チャンネルを検索（チャンネル名で検索）
    if (!type || type === 'channels') {
      const channelsQuery = `
        SELECT 
          c.*,
          cat.name as category_name,
          (SELECT COUNT(*) FROM posts p WHERE p.channel_id = c.id) as post_count
        FROM channels c
        JOIN categories cat ON c.category_id = cat.id
        WHERE c.name LIKE ? OR c.description LIKE ?
        ORDER BY c.name
        LIMIT 20
      `;
      
      const channels = db.prepare(channelsQuery).all(searchTerm, searchTerm);
      results.channels = channels;
    }

    res.json(results);
  } catch (error) {
    console.error('検索エラー:', error);
    res.status(500).json({ error: '検索に失敗しました' });
  }
});

// 高度な検索（特定のチャンネル内での検索など）
router.get('/advanced', authenticateToken, (req, res) => {
  const { q: query, channel_id, user_id, date_from, date_to } = req.query;
  
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: '検索クエリが必要です' });
  }

  const searchTerm = `%${query.trim()}%`;
  let conditions = ['p.content LIKE ?'];
  let params = [searchTerm];

  // チャンネル指定
  if (channel_id) {
    conditions.push('p.channel_id = ?');
    params.push(channel_id);
  }

  // ユーザー指定
  if (user_id) {
    conditions.push('p.user_id = ?');
    params.push(user_id);
  }

  // 日付範囲
  if (date_from) {
    conditions.push('p.created_at >= ?');
    params.push(date_from);
  }
  
  if (date_to) {
    conditions.push('p.created_at <= ?');
    params.push(date_to);
  }

  try {
    const query = `
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
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
    
    const posts = db.prepare(query).all(...params);
    res.json({ posts });
  } catch (error) {
    console.error('高度な検索エラー:', error);
    res.status(500).json({ error: '検索に失敗しました' });
  }
});

module.exports = router; 