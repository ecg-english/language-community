const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin, requireInstructor } = require('../middleware/auth');

// Multer設定
const uploadsDir = path.join(__dirname, '../uploads');

// uploadsディレクトリが存在しない場合は作成
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('uploadsディレクトリを作成しました:', uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
  },
  fileFilter: function (req, file, cb) {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// イベント一覧を取得
router.get('/', authenticateToken, (req, res) => {
  try {
    const events = db.prepare(`
      SELECT 
        e.*,
        u.username as created_by_name,
        u.role as created_by_role
      FROM events e
      JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date ASC, e.start_time ASC
    `).all();

    res.json({ events });
  } catch (error) {
    console.error('イベント取得エラー:', error);
    res.status(500).json({ error: 'イベントの取得に失敗しました' });
  }
});

// 特定の月のイベントを取得
router.get('/month/:year/:month', authenticateToken, (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const events = db.prepare(`
      SELECT 
        e.*,
        u.username as created_by_name,
        u.role as created_by_role
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.event_date >= ? AND e.event_date <= ?
      ORDER BY e.event_date ASC, e.start_time ASC
    `).all(startDate, endDate);

    res.json({ events });
  } catch (error) {
    console.error('月別イベント取得エラー:', error);
    res.status(500).json({ error: 'イベントの取得に失敗しました' });
  }
});

// イベントを作成（管理者・講師のみ）
router.post('/', authenticateToken, (req, res) => {
  try {
    console.log('イベント作成リクエスト:', req.body);
    console.log('ユーザー情報:', { userId: req.user.userId, role: req.user.role });
    
    const { title, description, target_audience, event_date, start_time, end_time, participation_method, cover_image, location } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 管理者・講師のみ作成可能
    const allowedRoles = ['サーバー管理者', 'ECG講師', 'JCG講師'];
    if (!allowedRoles.includes(userRole)) {
      console.log('権限エラー:', { userRole, allowedRoles });
      return res.status(403).json({ error: 'イベントの作成権限がありません' });
    }

    if (!title || !event_date) {
      console.log('必須フィールドエラー:', { title, event_date });
      return res.status(400).json({ error: 'タイトルと開催日は必須です' });
    }

    console.log('イベント作成SQL実行前:', {
      title: title.trim(),
      description: description || '',
      target_audience: target_audience || '',
      event_date,
      start_time: start_time || '',
      end_time: end_time || '',
      participation_method: participation_method || '',
      cover_image: cover_image || '',
      location: location || '',
      userId
    });

    const insertEvent = db.prepare(`
      INSERT INTO events (title, description, target_audience, event_date, start_time, end_time, participation_method, cover_image, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEvent.run(
      title.trim(),
      description || '',
      target_audience || '',
      event_date,
      start_time || '',
      end_time || '',
      participation_method || '',
      cover_image || '',
      location || '',
      userId
    );

    console.log('イベント作成結果:', result);
    console.log('作成されたイベントID:', result.lastInsertRowid);

    // 作成されたイベントを取得
    const newEvent = db.prepare(`
      SELECT 
        e.*,
        u.username as created_by_name,
        u.role as created_by_role
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid);

    console.log('取得されたイベント詳細:', newEvent);

    // チャンネル投稿も作成（Eventsチャンネル用）
    if (req.body.channel_id) {
      console.log('チャンネル投稿作成:', {
        content: title,
        userId,
        channelId: req.body.channel_id,
        imageUrl: cover_image || null,
        eventId: result.lastInsertRowid
      });
      
      const insertPost = db.prepare(`
        INSERT INTO posts (content, user_id, channel_id, image_url, event_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const postResult = insertPost.run(
        title, // イベントタイトルを投稿内容として使用
        userId,
        req.body.channel_id,
        cover_image || null,
        result.lastInsertRowid // イベントIDを保存
      );
      
      console.log('チャンネル投稿作成結果:', postResult);
    }

    res.status(201).json({
      message: 'イベントが作成されました',
      event: newEvent
    });
  } catch (error) {
    console.error('イベント作成エラー:', error);
    console.error('エラースタック:', error.stack);
    res.status(500).json({ 
      error: 'イベントの作成に失敗しました',
      details: error.message 
    });
  }
});

// イベントを更新（管理者・講師のみ）
router.put('/:eventId', authenticateToken, (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, target_audience, event_date, start_time, end_time, participation_method } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 管理者・講師のみ更新可能
    const allowedRoles = ['サーバー管理者', 'ECG講師', 'JCG講師'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'イベントの更新権限がありません' });
    }

    if (!title || !event_date) {
      return res.status(400).json({ error: 'タイトルと開催日は必須です' });
    }

    // イベントの存在確認
    const existingEvent = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    const updateEvent = db.prepare(`
      UPDATE events 
      SET title = ?, description = ?, target_audience = ?, event_date = ?, start_time = ?, end_time = ?, participation_method = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateEvent.run(
      title.trim(),
      description || '',
      target_audience || '',
      event_date,
      start_time || '',
      end_time || '',
      participation_method || '',
      eventId
    );

    // 更新されたイベントを取得
    const updatedEvent = db.prepare(`
      SELECT 
        e.*,
        u.username as created_by_name,
        u.role as created_by_role
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(eventId);

    res.json({
      message: 'イベントが更新されました',
      event: updatedEvent
    });
  } catch (error) {
    console.error('イベント更新エラー:', error);
    res.status(500).json({ error: 'イベントの更新に失敗しました' });
  }
});

// イベントを削除（管理者・講師のみ）
router.delete('/:eventId', authenticateToken, (req, res) => {
  try {
    const { eventId } = req.params;
    const userRole = req.user.role;

    // 管理者・講師のみ削除可能
    const allowedRoles = ['サーバー管理者', 'ECG講師', 'JCG講師'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'イベントの削除権限がありません' });
    }

    // イベントの存在確認
    const existingEvent = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    const deleteEvent = db.prepare('DELETE FROM events WHERE id = ?');
    deleteEvent.run(eventId);

    res.json({ message: 'イベントが削除されました' });
  } catch (error) {
    console.error('イベント削除エラー:', error);
    res.status(500).json({ error: 'イベントの削除に失敗しました' });
  }
});

// 特定のイベント詳細を取得
router.get('/:eventId', authenticateToken, (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('イベント詳細取得リクエスト:', { eventId, userId: req.user.userId });

    const event = db.prepare(`
      SELECT 
        e.*,
        u.username as created_by_name,
        u.role as created_by_role
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(eventId);

    console.log('イベント詳細取得結果:', event);

    if (!event) {
      console.log('イベントが見つかりません:', eventId);
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    res.json({ event });
  } catch (error) {
    console.error('イベント詳細取得エラー:', error);
    console.error('エラースタック:', error.stack);
    res.status(500).json({ error: 'イベントの取得に失敗しました' });
  }
});

// イベントの参加者一覧を取得
router.get('/:eventId/attendees', authenticateToken, (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('参加者取得リクエスト:', { eventId, userId: req.user.userId });

    const attendees = db.prepare(`
      SELECT 
        a.*,
        u.username,
        u.role,
        u.avatar_url
      FROM event_attendees a
      JOIN users u ON a.user_id = u.id
      WHERE a.event_id = ?
      ORDER BY a.created_at ASC
    `).all(eventId);

    console.log('参加者取得結果:', attendees);

    res.json({ attendees });
  } catch (error) {
    console.error('参加者取得エラー:', error);
    console.error('エラースタック:', error.stack);
    res.status(500).json({ error: '参加者の取得に失敗しました' });
  }
});

// イベントに参加する
router.post('/:eventId/attend', authenticateToken, (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // 既に参加しているかチェック
    const existingAttendance = db.prepare(`
      SELECT id FROM event_attendees 
      WHERE event_id = ? AND user_id = ?
    `).get(eventId, userId);

    if (existingAttendance) {
      return res.status(400).json({ error: '既に参加しています' });
    }

    // 参加を追加
    const insertAttendance = db.prepare(`
      INSERT INTO event_attendees (event_id, user_id) 
      VALUES (?, ?)
    `);
    
    insertAttendance.run(eventId, userId);

    res.json({ message: 'イベントに参加しました' });
  } catch (error) {
    console.error('参加処理エラー:', error);
    res.status(500).json({ error: '参加処理に失敗しました' });
  }
});

// イベントの参加をキャンセル
router.delete('/:eventId/attend', authenticateToken, (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // 参加を削除
    const deleteAttendance = db.prepare(`
      DELETE FROM event_attendees 
      WHERE event_id = ? AND user_id = ?
    `);
    
    const result = deleteAttendance.run(eventId, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '参加記録が見つかりません' });
    }

    res.json({ message: '参加をキャンセルしました' });
  } catch (error) {
    console.error('参加キャンセルエラー:', error);
    res.status(500).json({ error: '参加キャンセルに失敗しました' });
  }
});

// カバー画像アップロード
router.post('/upload/cover', authenticateToken, upload.single('cover_image'), (req, res) => {
  try {
    console.log('カバー画像アップロードリクエスト:', {
      file: req.file,
      body: req.body,
      userId: req.user.userId
    });

    if (!req.file) {
      console.log('ファイルがアップロードされていません');
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('アップロード成功:', { filename: req.file.filename, imageUrl });
    
    res.json({ 
      message: 'カバー画像がアップロードされました',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('カバー画像アップロードエラー:', error);
    console.error('エラースタック:', error.stack);
    res.status(500).json({ error: 'カバー画像のアップロードに失敗しました' });
  }
});

module.exports = router; 