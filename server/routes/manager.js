const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database');

// 権限チェックミドルウェア
const checkManagerPermission = (req, res, next) => {
  const userRole = req.user.role;
  if (userRole !== 'サーバー管理者') {
    return res.status(403).json({ success: false, message: 'サーバー管理者権限が必要です' });
  }
  next();
};

// 月次データテーブルの作成
const createMonthlyDataTable = () => {
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS manager_monthly_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        payment_status BOOLEAN DEFAULT 0,
        survey_completed BOOLEAN DEFAULT 0,
        survey_answers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, month)
      )
    `).run();
    console.log('manager_monthly_dataテーブルが作成されました');
  } catch (error) {
    console.error('manager_monthly_dataテーブル作成エラー:', error);
  }
};

// テーブル作成を実行
createMonthlyDataTable();

// 月次データを取得
router.get('/monthly-data/:month', authenticateToken, checkManagerPermission, (req, res) => {
  try {
    const { month } = req.params;
    
    const data = db.prepare(`
      SELECT student_id, month, payment_status, survey_completed, survey_answers
      FROM manager_monthly_data
      WHERE month = ?
      ORDER BY student_id
    `).all(month);

    res.json({ success: true, data });
  } catch (error) {
    console.error('月次データ取得エラー:', error);
    res.status(500).json({ success: false, message: '月次データの取得に失敗しました' });
  }
});

// 入金状態を更新
router.put('/monthly-data/:month/:studentId/payment', authenticateToken, checkManagerPermission, (req, res) => {
  try {
    const { month, studentId } = req.params;
    const { payment_status } = req.body;

    // 既存データを確認
    const existing = db.prepare(`
      SELECT id FROM manager_monthly_data 
      WHERE student_id = ? AND month = ?
    `).get(studentId, month);

    if (existing) {
      // 既存データを更新
      db.prepare(`
        UPDATE manager_monthly_data 
        SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND month = ?
      `).run(payment_status ? 1 : 0, studentId, month);
    } else {
      // 新規データを作成
      db.prepare(`
        INSERT INTO manager_monthly_data (student_id, month, payment_status)
        VALUES (?, ?, ?)
      `).run(studentId, month, payment_status ? 1 : 0);
    }

    res.json({ success: true, message: '入金状態を更新しました' });
  } catch (error) {
    console.error('入金状態更新エラー:', error);
    res.status(500).json({ success: false, message: '入金状態の更新に失敗しました' });
  }
});

// アンケート状態を更新
router.put('/monthly-data/:month/:studentId/survey', authenticateToken, checkManagerPermission, (req, res) => {
  try {
    const { month, studentId } = req.params;
    const { survey_completed } = req.body;

    // 既存データを確認
    const existing = db.prepare(`
      SELECT id FROM manager_monthly_data 
      WHERE student_id = ? AND month = ?
    `).get(studentId, month);

    if (existing) {
      // 既存データを更新
      db.prepare(`
        UPDATE manager_monthly_data 
        SET survey_completed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND month = ?
      `).run(survey_completed ? 1 : 0, studentId, month);
    } else {
      // 新規データを作成
      db.prepare(`
        INSERT INTO manager_monthly_data (student_id, month, survey_completed)
        VALUES (?, ?, ?)
      `).run(studentId, month, survey_completed ? 1 : 0);
    }

    res.json({ success: true, message: 'アンケート状態を更新しました' });
  } catch (error) {
    console.error('アンケート状態更新エラー:', error);
    res.status(500).json({ success: false, message: 'アンケート状態の更新に失敗しました' });
  }
});

// アンケート回答を更新
router.put('/monthly-data/:month/:studentId/survey-answers', authenticateToken, checkManagerPermission, (req, res) => {
  try {
    const { month, studentId } = req.params;
    const { survey_answers } = req.body;

    // 既存データを確認
    const existing = db.prepare(`
      SELECT id FROM manager_monthly_data 
      WHERE student_id = ? AND month = ?
    `).get(studentId, month);

    if (existing) {
      // 既存データを更新
      db.prepare(`
        UPDATE manager_monthly_data 
        SET survey_answers = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND month = ?
      `).run(survey_answers, studentId, month);
    } else {
      // 新規データを作成
      db.prepare(`
        INSERT INTO manager_monthly_data (student_id, month, survey_answers)
        VALUES (?, ?, ?)
      `).run(studentId, month, survey_answers);
    }

    res.json({ success: true, message: 'アンケート回答を更新しました' });
  } catch (error) {
    console.error('アンケート回答更新エラー:', error);
    res.status(500).json({ success: false, message: 'アンケート回答の更新に失敗しました' });
  }
});

module.exports = router; 