const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin, requireInstructor } = require('../middleware/auth');

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
      ORDER BY e.event_date ASC, e.event_time ASC
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
      ORDER BY e.event_date ASC, e.event_time ASC
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
    const { title, description, target_audience, event_date, start_time, end_time, participation_method } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // 管理者・講師のみ作成可能
    const allowedRoles = ['サーバー管理者', 'ECG講師', 'JCG講師'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'イベントの作成権限がありません' });
    }

    if (!title || !event_date) {
      return res.status(400).json({ error: 'タイトルと開催日は必須です' });
    }

    const insertEvent = db.prepare(`
      INSERT INTO events (title, description, target_audience, event_date, start_time, end_time, participation_method, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEvent.run(
      title.trim(),
      description || '',
      target_audience || '',
      event_date,
      start_time || '',
      end_time || '',
      participation_method || '',
      userId
    );

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

    res.status(201).json({
      message: 'イベントが作成されました',
      event: newEvent
    });
  } catch (error) {
    console.error('イベント作成エラー:', error);
    res.status(500).json({ error: 'イベントの作成に失敗しました' });
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

module.exports = router; 