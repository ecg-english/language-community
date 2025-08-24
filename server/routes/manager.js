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

// 講師の月別レッスン実施数を取得
router.get('/instructor-lessons/:month', authenticateToken, checkManagerPermission, (req, res) => {
  try {
    const { month } = req.params;
    console.log('講師レッスン数取得開始:', month);
    
    // 月形式（2025-08）を週形式（2025-W）に変換
    const [year, monthNum] = month.split('-');
    const weekPattern = `${year}-W`;
    console.log('週パターン:', weekPattern);
    
    // デバッグ用：講師一覧を確認
    const instructors = db.prepare(`
      SELECT id, username, role FROM users 
      WHERE role IN ('ECG講師', 'JCG講師', 'サーバー管理者')
    `).all();
    console.log('講師一覧:', instructors);
    
    // デバッグ用：生徒一覧を確認
    const students = db.prepare(`
      SELECT id, name, instructor_id FROM class1_students
    `).all();
    console.log('生徒一覧:', students);
    
    // デバッグ用：レッスン完了データを確認
    const lessonData = db.prepare(`
      SELECT student_id, week_key, lesson_completed 
      FROM class1_weekly_checklist 
      WHERE lesson_completed = 1
    `).all();
    console.log('レッスン完了データ:', lessonData);
    
    // 各講師の月別レッスン実施数を取得（通常レッスン + 追加レッスン）
    const instructorLessons = db.prepare(`
      SELECT 
        u.id as instructor_id,
        u.username as instructor_name,
        u.role as instructor_role,
        COUNT(DISTINCT cs.id) as total_students,
        (
          COUNT(CASE WHEN wcd.lesson_completed = 1 THEN 1 END) + 
          COUNT(CASE WHEN al.lesson_completed = 1 THEN 1 END)
        ) as completed_lessons
      FROM users u
      LEFT JOIN class1_students cs ON u.id = cs.instructor_id
      LEFT JOIN class1_weekly_checklist wcd ON cs.id = wcd.student_id 
        AND wcd.week_key LIKE ? || '%'
      LEFT JOIN class1_additional_lessons al ON cs.id = al.student_id 
        AND al.week_key LIKE ? || '%'
      WHERE u.role IN ('ECG講師', 'JCG講師', 'サーバー管理者')
      GROUP BY u.id, u.username, u.role
      ORDER BY u.username
    `).all(weekPattern, weekPattern);
    
    console.log('講師レッスン数結果:', instructorLessons);
    res.json({ success: true, data: instructorLessons });
  } catch (error) {
    console.error('講師レッスン数取得エラー:', error);
    res.status(500).json({ success: false, message: '講師レッスン数の取得に失敗しました' });
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