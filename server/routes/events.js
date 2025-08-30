const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// イベント一覧取得（軽量化）
router.get('/', (req, res) => {
  console.log('=== Events API: イベント一覧取得リクエスト受信 ===');

  try {
    const events = db.prepare(`
      SELECT e.id, e.title, e.description, e.target_audience, e.event_date,
             e.start_time, e.end_time, e.participation_method, e.created_by,
             e.created_at, e.updated_at, e.location, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date DESC
    `).all();

    console.log('イベント一覧取得成功:', { eventCount: events.length });
    res.json(events);
  } catch (error) {
    console.error('イベント一覧取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 月別イベント取得
router.get('/month/:year/:month', (req, res) => {
  const { year, month } = req.params;
  console.log('=== Events API: 月別イベント取得リクエスト受信 ===', { year, month });

  try {
    // 指定月のイベントを取得
    const events = db.prepare(`
      SELECT e.id, e.title, e.description, e.target_audience, e.event_date,
             e.start_time, e.end_time, e.participation_method, e.created_by,
             e.created_at, e.updated_at, e.location, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE strftime('%Y-%m', e.event_date) = ?
      ORDER BY e.event_date ASC, e.start_time ASC
    `).all(`${year}-${month.padStart(2, '0')}`);

    console.log('月別イベント取得成功:', { year, month, eventCount: events.length });
    res.json({ events });
  } catch (error) {
    console.error('月別イベント取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 特定のイベント詳細取得
router.get('/:id', (req, res) => {
  const eventId = req.params.id;
  console.log('=== Events API: イベント詳細取得リクエスト受信 ===', { eventId });
  
  try {
    const event = db.prepare(`
      SELECT e.id, e.title, e.description, e.target_audience, e.event_date, 
             e.start_time, e.end_time, e.participation_method, e.created_by, 
             e.created_at, e.updated_at, e.location, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(eventId);

    console.log('データベースから取得したイベント（軽量化）:', { 
      id: event?.id, 
      title: event?.title,
      event_date: event?.event_date 
    });

    if (!event) {
      console.log('イベントが見つかりません:', { eventId });
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    // postsテーブルからカバーイメージを取得
    const postImage = db.prepare(`
      SELECT image_url, content
      FROM posts 
      WHERE event_id = ? AND image_url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).get(eventId);

    console.log('postsから取得した画像:', { 
      hasImage: !!postImage?.image_url,
      imageUrl: postImage?.image_url?.substring(0, 50) + '...' 
    });

    const attendees = db.prepare(`
      SELECT ea.*, u.username, u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = ?
    `).all(eventId);

    console.log('参加者データ:', { eventId, attendeeCount: attendees.length });

    const response = {
      ...event,
      cover_image: postImage?.image_url || null, // postsのimage_urlを使用
      attendees: attendees
    };

    console.log('軽量化レスポンス送信:', { 
      eventId, 
      title: event.title, 
      responseSize: 'lightweight',
      hasCoverImage: !!response.cover_image
    });
    res.json(response);
  } catch (error) {
    console.error('イベント詳細取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// イベント参加者一覧取得
router.get('/:id/attendees', (req, res) => {
  const eventId = req.params.id;
  console.log('=== Events API: 参加者一覧取得リクエスト受信 ===', { eventId });
  
  try {
    const attendees = db.prepare(`
      SELECT ea.*, u.username, u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = ?
    `).all(eventId);

    console.log('参加者データ取得:', { eventId, attendeeCount: attendees.length });
    console.log('レスポンス送信:', attendees);
    res.json(attendees);
  } catch (error) {
    console.error('参加者取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// イベント参加登録
router.post('/:id/attend', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId || req.user.id;

    // 既に参加済みかチェック
    const existing = db.prepare(`
      SELECT id FROM event_attendees 
      WHERE event_id = ? AND user_id = ?
    `).get(eventId, userId);

    if (existing) {
      return res.status(400).json({ error: '既に参加登録済みです' });
    }

    // 参加登録
    db.prepare(`
      INSERT INTO event_attendees (event_id, user_id)
      VALUES (?, ?)
    `).run(eventId, userId);

    res.json({ message: 'イベントに参加登録しました' });
  } catch (error) {
    console.error('参加登録エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// イベント参加キャンセル
router.delete('/:id/attend', authenticateToken, (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.userId || req.user.id;

    const result = db.prepare(`
      DELETE FROM event_attendees 
      WHERE event_id = ? AND user_id = ?
    `).run(eventId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '参加登録が見つかりません' });
    }

    res.json({ message: 'イベント参加をキャンセルしました' });
  } catch (error) {
    console.error('参加キャンセルエラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// イベント作成 (管理者用)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, cover_image, target_audience, participation_method } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!title || !event_date) {
      return res.status(400).json({ error: '必須フィールドが不足しています' });
    }

    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, start_time, end_time, location, cover_image, target_audience, participation_method, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, event_date, start_time, end_time, location, cover_image, target_audience, participation_method, userId);

    res.status(201).json({ 
      message: 'イベントが作成されました',
      eventId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('イベント作成エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// カバー画像アップロード
router.post('/upload/cover', authenticateToken, (req, res) => {
  console.log('=== Events API: カバー画像アップロードリクエスト受信 ===');
  console.log('リクエストボディ:', req.body);
  console.log('リクエストヘッダー:', req.headers['content-type']);
  
  try {
    // FormDataとJSONの両方に対応
    let imageData = null;
    let fileName = null;
    
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      // FormDataの場合
      console.log('FormData形式で受信');
      if (req.body.cover_image) {
        // ファイルがbase64で送信されている場合
        imageData = req.body.cover_image;
        fileName = req.body.fileName || 'cover.jpg';
      }
    } else {
      // JSONの場合
      console.log('JSON形式で受信');
      imageData = req.body.imageData;
      fileName = req.body.fileName;
    }
    
    if (!imageData) {
      console.log('画像データが見つかりません');
      return res.status(400).json({ error: '画像データが不足しています' });
    }

    // 画像データをそのまま返す（フロントエンドで処理）
    console.log('カバー画像アップロード成功:', { 
      hasImageData: !!imageData,
      fileName: fileName || 'unknown',
      dataLength: imageData.length 
    });

    res.json({ 
      success: true,
      message: 'カバー画像がアップロードされました',
      imageUrl: imageData // base64データをそのまま返す
    });
  } catch (error) {
    console.error('カバー画像アップロードエラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

module.exports = router; 