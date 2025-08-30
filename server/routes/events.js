const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// イベント一覧取得（軽量化）
router.get('/', (req, res) => {
  console.log('=== Events API: イベント一覧取得リクエスト受信 ===');

  try {
    const events = db.prepare(`
      SELECT e.id, e.title, e.description, e.target_audience, e.event_date,
             e.start_time, e.end_time, e.participation_method, e.created_by,
             e.created_at, e.updated_at, e.location, e.cover_image, u.username as created_by_name
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
             e.created_at, e.updated_at, e.location, e.cover_image, u.username as created_by_name
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
             e.created_at, e.updated_at, e.location, e.cover_image, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(eventId);

    console.log('データベースから取得したイベント（軽量化）:', { 
      id: event?.id, 
      title: event?.title,
      event_date: event?.event_date,
      cover_image: event?.cover_image ? '存在' : 'なし'
    });

    if (!event) {
      console.log('イベントが見つかりません:', { eventId });
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    const attendees = db.prepare(`
      SELECT ea.*, u.username, u.avatar_url
      FROM event_attendees ea
      LEFT JOIN users u ON ea.user_id = u.id
      WHERE ea.event_id = ?
    `).all(eventId);

    console.log('参加者データ:', { eventId, attendeeCount: attendees.length });

    const response = {
      ...event,
      attendees: attendees
    };

    console.log('レスポンス送信:', { 
      eventId: response.id, 
      title: response.title,
      hasCoverImage: !!response.cover_image,
      attendeeCount: response.attendees.length
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
  console.log('=== Events API: イベント作成リクエスト受信 ===');
  console.log('リクエストボディ:', req.body);
  console.log('ユーザー情報:', req.user);
  
  try {
    const { title, description, event_date, start_time, end_time, location, cover_image, target_audience, participation_method } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('パースされたデータ:', {
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      cover_image: cover_image ? '存在' : 'なし',
      target_audience,
      participation_method,
      userId
    });

    if (!title || !event_date) {
      console.log('必須フィールド不足:', { title: !!title, event_date: !!event_date });
      return res.status(400).json({ error: '必須フィールドが不足しています' });
    }

    console.log('イベント作成開始...');
    const result = db.prepare(`
      INSERT INTO events (title, description, event_date, start_time, end_time, location, cover_image, target_audience, participation_method, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, event_date, start_time, end_time, location, cover_image, target_audience, participation_method, userId);

    console.log('イベント作成成功:', {
      eventId: result.lastInsertRowid,
      changes: result.changes
    });

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

    // ログ出力を軽量化（base64データの最初の100文字のみ表示）
    const truncatedImageData = imageData.length > 100 
      ? imageData.substring(0, 100) + '... (truncated)'
      : imageData;
    
    console.log('リクエストボディ（軽量化）:', {
      imageData: truncatedImageData,
      fileName: fileName,
      originalLength: imageData.length
    });
    console.log('リクエストヘッダー:', req.headers['content-type']);

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
    const savedFileName = `event_cover_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    let uploadsDir;
    
    if (process.env.NODE_ENV === 'production') {
      // Renderの永続化ディスクを使用
      uploadsDir = '/opt/render/data/uploads';
    } else {
      // 開発環境
      uploadsDir = path.join(__dirname, '../uploads');
    }
    
    const filePath = path.join(uploadsDir, savedFileName);
    
    // uploadsディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, buffer);
    
    // 画像URLを返す（バックエンドのURLを含む）
    const backendUrl = process.env.BACKEND_URL || 'https://language-community-backend.onrender.com';
    const imageUrl = `${backendUrl}/uploads/${savedFileName}`;

    console.log('カバー画像アップロード成功:', { 
      hasImageData: !!imageData,
      fileName: fileName || 'unknown',
      originalDataLength: imageData.length,
      bufferSize: buffer.length,
      savedFileName: savedFileName,
      imageUrl: imageUrl
    });

    res.json({ 
      success: true,
      message: 'カバー画像がアップロードされました',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('カバー画像アップロードエラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

module.exports = router; 