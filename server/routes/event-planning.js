const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// デフォルトタスクテンプレート
const defaultTasks = [
  { name: 'イベント企画書作成', deadline_days_before: 30, url: '' },
  { name: 'フライヤー作成→グループLINEで共有', deadline_days_before: 30, url: '' },
  { name: 'Instagram投稿', deadline_days_before: 25, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'コミュニティ投稿', deadline_days_before: 30, url: 'https://ecg-english.github.io/language-community' },
  { name: '公式LINE予約投稿', deadline_days_before: 30, url: 'https://utage-system.com/operator/thOIhLyBdzs4/login' },
  { name: '印刷して店舗張り出し', deadline_days_before: 30, url: '' },
  { name: 'Meetup投稿', deadline_days_before: 7, url: '' },
  { name: 'Instagramで単体投稿', deadline_days_before: 7, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'ストーリー投稿', deadline_days_before: 7, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'イベント準備物確認と買い出し', deadline_days_before: 3, url: '' },
  { name: 'ストーリー再投稿', deadline_days_before: 1, url: 'https://www.instagram.com/english_ecg/' },
  { name: 'コミュニティのお知らせ投稿やアクティビティ', deadline_days_before: 1, url: 'https://ecg-english.github.io/language-community' },
  { name: 'イベント実施と反省メモ', deadline_days_before: 0, url: '' }
];

// 企画イベント一覧取得（全ユーザー共有）
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    console.log('=== Event Planning API: 企画イベント取得リクエスト ===', { userId });
    
    // 全ユーザーのイベントを取得（共有化）
    const events = db.prepare(`
      SELECT pe.*, u.username as created_by_name
      FROM planning_events pe
      LEFT JOIN users u ON pe.user_id = u.id
      ORDER BY pe.event_date DESC
    `).all();

    console.log('取得した企画イベント数:', events.length);

    // 各イベントのタスクを取得
    const eventsWithTasks = events.map(event => {
      const tasks = db.prepare(`
        SELECT * FROM planning_tasks 
        WHERE event_id = ? 
        ORDER BY deadline_date ASC
      `).all(event.id);

      return {
        ...event,
        tasks: tasks
      };
    });

    console.log('企画イベント取得成功:', { 
      userId, 
      eventCount: eventsWithTasks.length,
      shared: true
    });
    
    res.json(eventsWithTasks);
  } catch (error) {
    console.error('企画イベント取得エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// 企画イベント作成
router.post('/', authenticateToken, (req, res) => {
  try {
    const { title, description, event_date, start_time, end_time, location, member_fee, visitor_fee } = req.body;
    const userId = req.user.userId || req.user.id;
    
    console.log('=== Event Planning API: 企画イベント作成リクエスト ===', {
      title, event_date, start_time, end_time, userId
    });
    
    if (!title || !event_date || !start_time || !end_time) {
      return res.status(400).json({ error: '必須フィールドが不足しています' });
    }

    // イベント作成
    const insertEvent = db.prepare(`
      INSERT INTO planning_events (user_id, title, description, event_date, start_time, end_time, location, member_fee, visitor_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertEvent.run(
      userId, title, description, event_date, start_time, end_time, 
      location || '', parseInt(member_fee) || 0, parseInt(visitor_fee) || 0
    );
    
    const eventId = result.lastInsertRowid;
    
    // デフォルトタスクを作成
    const insertTask = db.prepare(`
      INSERT INTO planning_tasks (event_id, name, deadline_days_before, deadline_date, is_completed, url)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    
    defaultTasks.forEach(task => {
      const eventDate = new Date(event_date);
      const deadlineDate = new Date(eventDate);
      deadlineDate.setDate(deadlineDate.getDate() - task.deadline_days_before);
      
      insertTask.run(
        eventId,
        task.name,
        task.deadline_days_before,
        deadlineDate.toISOString().split('T')[0],
        task.url || ''
      );
    });
    
    console.log('企画イベント作成成功:', { eventId, taskCount: defaultTasks.length });
    
    res.status(201).json({ 
      message: '企画イベントとタスクが作成されました',
      eventId: eventId
    });
  } catch (error) {
    console.error('企画イベント作成エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

// タスク完了状態更新（全ユーザー共有）
router.put('/tasks/:taskId', authenticateToken, (req, res) => {
  try {
    const { taskId } = req.params;
    const { is_completed } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('=== Event Planning API: タスク更新リクエスト ===', { taskId, is_completed, userId });

    if (typeof is_completed !== 'number') {
      return res.status(400).json({ error: 'is_completedは0または1である必要があります' });
    }

    // タスク更新（全ユーザー共有のため権限チェックなし）
    const updateTask = db.prepare(`
      UPDATE planning_tasks 
      SET is_completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateTask.run(is_completed, taskId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'タスクが見つかりません' });
    }

    console.log('タスク更新成功:', { taskId, is_completed, changes: result.changes, shared: true });
    res.json({ 
      message: 'タスクが更新されました',
      taskId: taskId,
      is_completed: is_completed
    });
  } catch (error) {
    console.error('タスク更新エラー:', error);
    res.status(500).json({ error: 'サーバーエラー' });
  }
});

module.exports = router; 