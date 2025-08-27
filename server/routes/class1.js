const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// データベース接続
const db = require('../database');

// 権限チェックミドルウェア
const checkClass1Permission = (req, res, next) => {
  const userRole = req.user.role;
  if (userRole === 'ECG講師' || userRole === 'JCG講師' || userRole === 'サーバー管理者') {
    next();
  } else {
    res.status(403).json({ success: false, message: '権限がありません' });
  }
};

// 生徒一覧を取得
router.get('/students', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('Class1 students API called');
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_students'
    `).get();
    
    if (!tableExists) {
      console.error('class1_students table does not exist');
      return res.json({ success: true, students: [] });
    }
    
    // まずmember_numberカラムが存在するかチェック
    const columnExists = db.prepare(`
      PRAGMA table_info(class1_students)
    `).all().some(column => column.name === 'member_number');

    // IDを会員番号として使用するクエリ
    const query = `
      SELECT 
        s.id,
        s.name,
        s.id as member_number,
        s.instructor_id,
        u.username as instructor_name,
        s.email,
        s.memo,
        s.next_lesson_date,
        s.lesson_completed_date,
        CASE WHEN s.next_lesson_date IS NOT NULL THEN 1 ELSE 0 END as dm_scheduled,
        CASE WHEN s.lesson_completed_date IS NOT NULL THEN 1 ELSE 0 END as lesson_completed,
        s.created_at
      FROM class1_students s
      LEFT JOIN users u ON s.instructor_id = u.id
      ORDER BY s.created_at DESC
    `;

    const students = db.prepare(query).all();

    console.log('Students found:', students.length);
    console.log('member_number column exists:', columnExists);
    console.log('=== DETAILED STUDENT DATA ===');
    students.forEach((s, index) => {
      console.log(`Student ${index + 1}:`, {
        id: s.id,
        name: s.name,
        member_number: s.member_number,
        member_number_type: typeof s.member_number,
        instructor_name: s.instructor_name
      });
    });
    console.log('=== END DETAILED DATA ===');
    
    const response = { success: true, students };
    console.log('=== API RESPONSE BEING SENT ===');
    console.log('Response object:', JSON.stringify(response, null, 2));
    console.log('=== END API RESPONSE ===');
    
    res.json(response);
  } catch (error) {
    console.error('生徒一覧取得エラー:', error);
    res.status(500).json({ success: false, message: '生徒一覧の取得に失敗しました: ' + error.message });
  }
});

// 会員番号を生成する関数（英数3文字）
const generateMemberNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 既存の会員番号と重複しないかチェック
  const existing = db.prepare(`
    SELECT member_number FROM class1_students WHERE member_number = ?
  `).get(result);
  
  if (existing) {
    // 重複した場合は再帰的に新しい番号を生成
    return generateMemberNumber();
  }
  
  return result;
};

// 生徒を追加
router.post('/students', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('Add student API called with body:', req.body);
    const { name, instructor_id, memo, email } = req.body;

    if (!name || !instructor_id) {
      return res.status(400).json({ success: false, message: '生徒名と担当講師は必須です' });
    }

    // 生徒を追加（IDが自動的に会員番号になる）
    const result = db.prepare(`
      INSERT INTO class1_students (name, instructor_id, memo, email, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(name, instructor_id, memo || null, email || null);
    
    // 追加された生徒のIDを会員番号として使用
    const memberNumber = result.lastInsertRowid;

    console.log('Student added successfully:', result.lastInsertRowid);
    res.json({ 
      success: true, 
      message: '生徒を追加しました',
      studentId: result.lastInsertRowid,
      memberNumber: memberNumber
    });
  } catch (error) {
    console.error('生徒追加エラー:', error);
    res.status(500).json({ success: false, message: '生徒の追加に失敗しました: ' + error.message });
  }
});

// レッスン日を更新
router.put('/students/:studentId/lesson-date', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { field, value } = req.body;

    if (!['next_lesson_date', 'lesson_completed_date'].includes(field)) {
      return res.status(400).json({ success: false, message: '無効なフィールドです' });
    }

    // 動的フィールド名を安全に処理
    if (field === 'next_lesson_date') {
      db.prepare(`
        UPDATE class1_students 
        SET next_lesson_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(value || null, studentId);
    } else {
      db.prepare(`
        UPDATE class1_students 
        SET lesson_completed_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(value || null, studentId);
    }

    res.json({ success: true, message: 'レッスン日を更新しました' });
  } catch (error) {
    console.error('レッスン日更新エラー:', error);
    res.status(500).json({ success: false, message: 'レッスン日の更新に失敗しました: ' + error.message });
  }
});

// 生徒情報を更新
router.put('/students/:studentId', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, instructor_id, email, memo } = req.body;

    if (!name || !instructor_id) {
      return res.status(400).json({ success: false, message: '生徒名と担当講師は必須です' });
    }

    const result = db.prepare(`
      UPDATE class1_students 
      SET name = ?, instructor_id = ?, email = ?, memo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, instructor_id, email || null, memo || null, studentId);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '生徒が見つかりません' });
    }

    console.log('Student updated successfully:', studentId);
    res.json({ success: true, message: '生徒情報を更新しました' });
  } catch (error) {
    console.error('生徒更新エラー:', error);
    res.status(500).json({ success: false, message: '生徒情報の更新に失敗しました: ' + error.message });
  }
});

// 生徒を削除
router.delete('/students/:studentId', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('Delete student API called for ID:', req.params.studentId);
    const { studentId } = req.params;

    const result = db.prepare('DELETE FROM class1_students WHERE id = ?').run(studentId);
    console.log('Delete result:', result.changes);

    res.json({ success: true, message: '生徒を削除しました' });
  } catch (error) {
    console.error('生徒削除エラー:', error);
    res.status(500).json({ success: false, message: '生徒の削除に失敗しました: ' + error.message });
  }
});

// 週次チェックリストの取得
router.get('/weekly-checklist/:weekKey', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    const { weekKey } = req.params;
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_weekly_checklist'
    `).get();
    
    if (!tableExists) {
      console.log('class1_weekly_checklist table does not exist, returning empty data');
      return res.json({
        success: true,
        checklist: []
      });
    }
    
    const checklist = db.prepare(`
      SELECT * FROM class1_weekly_checklist 
      WHERE week_key = ?
    `).all(weekKey);
    
    console.log('Weekly checklist data:', { weekKey, checklistCount: checklist.length });
    
    res.json({
      success: true,
      checklist: checklist
    });
  } catch (error) {
    console.error('週次チェックリスト取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 週次チェックリストの更新
router.put('/weekly-checklist/:weekKey/:studentId', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    const { weekKey, studentId } = req.params;
    const { dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date } = req.body;
    
    console.log('Weekly checklist update request received:', { 
      weekKey, 
      studentId, 
      dm_scheduled, 
      lesson_completed, 
      next_lesson_date, 
      lesson_completed_date,
      body: req.body 
    });
    
    // パラメータの検証と型変換
    if (!weekKey || !studentId) {
      console.error('Missing required parameters:', { weekKey, studentId });
      return res.status(400).json({
        success: false,
        error: '週キーと生徒IDは必須です'
      });
    }
    
    // studentIdを整数に変換
    const studentIdInt = parseInt(studentId, 10);
    if (isNaN(studentIdInt)) {
      console.error('Invalid studentId:', studentId);
      return res.status(400).json({
        success: false,
        error: '無効な生徒IDです'
      });
    }
    
    // boolean値を0/1に変換
    const dmScheduledInt = dm_scheduled ? 1 : 0;
    const lessonCompletedInt = lesson_completed ? 1 : 0;
    
    console.log('Converted values:', {
      studentIdInt,
      dmScheduledInt,
      lessonCompletedInt,
      next_lesson_date,
      lesson_completed_date
    });
    
    // テーブルが存在するかチェック
    console.log('Checking if table exists...');
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_weekly_checklist'
    `).get();
    
    console.log('Table exists check result:', tableExists);
    
    if (!tableExists) {
      console.log('Creating class1_weekly_checklist table');
      try {
        db.prepare(`
          CREATE TABLE IF NOT EXISTS class1_weekly_checklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_key TEXT NOT NULL,
            student_id INTEGER NOT NULL,
            dm_scheduled BOOLEAN DEFAULT FALSE,
            lesson_completed BOOLEAN DEFAULT FALSE,
            next_lesson_date TEXT,
            lesson_completed_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(week_key, student_id)
          )
        `).run();
        console.log('Table created successfully');
      } catch (createError) {
        console.error('Table creation error:', createError);
        return res.status(500).json({
          success: false,
          error: 'テーブルの作成に失敗しました: ' + createError.message
        });
      }
    }
    
    // 既存データを確認
    console.log('Checking for existing data...');
    const existing = db.prepare(`
      SELECT * FROM class1_weekly_checklist 
      WHERE week_key = ? AND student_id = ?
    `).get(weekKey, studentIdInt);
    
    console.log('Existing data check result:', existing);
    
    if (existing) {
      // 更新
      console.log('Updating existing entry...');
      try {
        const updateResult = db.prepare(`
          UPDATE class1_weekly_checklist 
          SET dm_scheduled = ?, lesson_completed = ?, next_lesson_date = ?, lesson_completed_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE week_key = ? AND student_id = ?
        `).run(dmScheduledInt, lessonCompletedInt, next_lesson_date, lesson_completed_date, weekKey, studentIdInt);
        
        console.log('Update result:', updateResult);
        console.log('Updated existing weekly checklist entry');
      } catch (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'データの更新に失敗しました: ' + updateError.message
        });
      }
    } else {
      // 新規作成
      console.log('Creating new entry...');
      try {
        const insertResult = db.prepare(`
          INSERT INTO class1_weekly_checklist 
          (week_key, student_id, dm_scheduled, lesson_completed, next_lesson_date, lesson_completed_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(weekKey, studentIdInt, dmScheduledInt, lessonCompletedInt, next_lesson_date, lesson_completed_date);
        
        console.log('Insert result:', insertResult);
        console.log('Created new weekly checklist entry');
      } catch (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({
          success: false,
          error: 'データの作成に失敗しました: ' + insertError.message
        });
      }
    }
    
    console.log('Weekly checklist update completed successfully');
    res.json({
      success: true,
      message: '週次チェックリストが更新されました'
    });
  } catch (error) {
    console.error('週次チェックリスト更新エラー:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 全週チェックリストデータを取得
router.get('/weekly-checklist-all', authenticateToken, checkClass1Permission, async (req, res) => {
  try {
    console.log('全週チェックリストデータ取得開始');
    
    // テーブルが存在するかチェック
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='class1_weekly_checklist'
    `).get();
    
    if (!tableExists) {
      console.log('class1_weekly_checklist table does not exist, returning empty data');
      return res.json({
        success: true,
        allChecklist: {}
      });
    }
    
    // 全データを取得
    const allChecklist = db.prepare(`
      SELECT * FROM class1_weekly_checklist 
      ORDER BY week_key, student_id
    `).all();
    
    console.log('全週チェックリストデータ取得完了:', allChecklist.length, '件');
    
    // 週ごとにグループ化
    const groupedData = {};
    
    allChecklist.forEach((item) => {
      const weekKey = item.week_key;
      if (!groupedData[weekKey]) {
        groupedData[weekKey] = {};
      }
      
      groupedData[weekKey][item.student_id] = {
        dm_scheduled: item.dm_scheduled === 1,
        lesson_completed: item.lesson_completed === 1,
        next_lesson_date: item.next_lesson_date || '',
        lesson_completed_date: item.lesson_completed_date || ''
      };
    });
    
    console.log('グループ化完了:', Object.keys(groupedData).length, '週分');
    
    res.json({
      success: true,
      allChecklist: groupedData
    });
  } catch (error) {
    console.error('全週チェックリスト取得エラー:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 生徒のメモを更新
router.put('/students/:id/memo', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { memo } = req.body;
    
    // 生徒の存在確認
    const student = db.prepare('SELECT id FROM class1_students WHERE id = ?').get(id);
    if (!student) {
      return res.status(404).json({ success: false, message: '生徒が見つかりません' });
    }

    // メモを更新
    db.prepare(`
      UPDATE class1_students 
      SET memo = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(memo || null, id);

    res.json({ success: true, message: 'メモを更新しました' });
  } catch (error) {
    console.error('メモ更新エラー:', error);
    res.status(500).json({ success: false, message: 'メモの更新に失敗しました' });
  }
});

module.exports = router; 