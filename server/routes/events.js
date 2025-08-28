const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// イベント一覧取得
router.get('/', (req, res) => {
  console.log('=== Events API: イベント一覧取得リクエスト受信 ===');
  try {
    const events = db.prepare(`
      SELECT e.*, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date DESC
    `).all();

    console.log('取得されたイベント数:', events.length);

    const eventsWithAttendees = events.map(event => {
      const attendees = db.prepare(`
        SELECT ea.*, u.username, u.avatar_url
        FROM event_attendees ea
        LEFT JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id = ?
      `).all(event.id);

      return {
        ...event,
        attendees: attendees
      };
    });

    console.log('レスポンス送信:', eventsWithAttendees.length, 'イベント');
    res.json(eventsWithAttendees);
  } catch (error) {
    console.error('イベント取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 特定のイベント詳細取得
router.get('/:id', (req, res) => {
  const eventId = req.params.id;
  console.log('=== Events API: イベント詳細取得リクエスト受信 ===', { eventId });
  
  try {
    const event = db.prepare(`
      SELECT e.*, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(eventId);

    console.log('データベースから取得したイベント:', event);

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

    console.log('レスポンス送信:', { eventId, title: event.title });
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

module.exports = router; 