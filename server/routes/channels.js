const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin, checkChannelViewPermission } = require('../middleware/auth');

// カテゴリ一覧を取得
router.get('/categories', authenticateToken, (req, res) => {
  try {
    console.log('カテゴリ取得APIが呼ばれました:', new Date().toISOString());
    
    const categories = db.prepare(`
      SELECT 
        id, 
        name, 
        is_collapsed,
        display_order,
        created_at
      FROM categories 
      ORDER BY display_order ASC, id ASC
    `).all();

    console.log('取得されたカテゴリ数:', categories.length);
    res.json({ categories });
  } catch (error) {
    console.error('カテゴリ取得エラー:', error);
    res.status(500).json({ error: 'カテゴリの取得に失敗しました' });
  }
});

// 特定のチャンネル情報を取得
router.get('/channels/:channelId', authenticateToken, checkChannelViewPermission, (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM posts p WHERE p.channel_id = c.id) as post_count
      FROM channels c
      WHERE c.id = ?
    `).get(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'チャンネルが見つかりません' });
    }

    res.json({ channel });
  } catch (error) {
    console.error('チャンネル情報取得エラー:', error);
    res.status(500).json({ error: 'チャンネル情報の取得に失敗しました' });
  }
});

// 特定のカテゴリのチャンネル一覧を取得（権限に基づくフィルタリング付き）
router.get('/categories/:categoryId/channels', authenticateToken, (req, res) => {
  try {
    const { categoryId } = req.params;
    const userRole = req.user.role;

    console.log('チャンネル一覧取得 - ユーザーロール:', userRole);

    // 全チャンネルを取得
    const allChannels = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM posts p WHERE p.channel_id = c.id) as post_count
      FROM channels c
      WHERE c.category_id = ?
      ORDER BY c.display_order ASC, c.created_at ASC
    `).all(categoryId);

    // ユーザーの権限に基づいてチャンネルをフィルタリング
    const filteredChannels = allChannels.filter(channel => {
      switch (channel.channel_type) {
        case 'admin_only_instructors_view':
          // 管理者・講師のみ閲覧可能
          return ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
        
        case 'class1_post_class1_view':
          // Class1メンバー以上のみ閲覧可能
          return ['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members'].includes(userRole);
        
        case 'admin_only_all_view':
        case 'instructors_post_all_view':
        case 'all_post_all_view':
          // 全メンバー閲覧可能
          return true;
        
        default:
          console.warn('未知のチャンネルタイプ:', channel.channel_type);
          return false;
      }
    });

    console.log(`チャンネルフィルタリング結果: ${allChannels.length}個中${filteredChannels.length}個を表示`);

    res.json({ channels: filteredChannels });
  } catch (error) {
    console.error('チャンネル取得エラー:', error);
    res.status(500).json({ error: 'チャンネルの取得に失敗しました' });
  }
});

// カテゴリの折りたたみ状態を切り替え
router.put('/categories/:categoryId/toggle', authenticateToken, (req, res) => {
  try {
    const { categoryId } = req.params;

    // 現在の状態を取得
    const category = db.prepare('SELECT is_collapsed FROM categories WHERE id = ?').get(categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'カテゴリが見つかりません' });
    }

    // 状態を切り替え
    const newState = category.is_collapsed ? 0 : 1;
    const updateCategory = db.prepare('UPDATE categories SET is_collapsed = ? WHERE id = ?');
    updateCategory.run(newState, categoryId);

    res.json({ 
      message: 'カテゴリの状態が更新されました',
      is_collapsed: Boolean(newState)
    });
  } catch (error) {
    console.error('カテゴリ切り替えエラー:', error);
    res.status(500).json({ error: 'カテゴリの切り替えに失敗しました' });
  }
});

// 新しいカテゴリを作成（管理者のみ）
router.post('/categories', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name } = req.body;

    console.log('カテゴリ作成APIが呼ばれました:', { name, timestamp: new Date().toISOString() });

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'カテゴリ名を入力してください' });
    }

    const trimmedName = name.trim();

    // 重複チェック（大文字小文字を区別しない）
    const existingCategory = db.prepare(`
      SELECT id FROM categories 
      WHERE LOWER(name) = LOWER(?)
    `).get(trimmedName);
    
    if (existingCategory) {
      console.log('重複カテゴリが検出されました:', trimmedName);
      return res.status(400).json({ error: 'このカテゴリ名は既に存在します' });
    }

    const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const result = insertCategory.run(trimmedName);

    console.log('新しいカテゴリが作成されました:', { id: result.lastInsertRowid, name: trimmedName });

    res.status(201).json({
      message: 'カテゴリが作成されました',
      category: {
        id: result.lastInsertRowid,
        name: trimmedName,
        is_collapsed: false
      }
    });
  } catch (error) {
    console.error('カテゴリ作成エラー:', error);
    res.status(500).json({ error: 'カテゴリの作成に失敗しました' });
  }
});

// 新しいチャンネルを作成（管理者のみ）
router.post('/categories/:categoryId/channels', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, channel_type } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'チャンネル名を入力してください' });
    }

    const validChannelTypes = [
      'admin_only_instructors_view',
      'admin_only_all_view', 
      'instructors_post_all_view',
      'all_post_all_view',
      'class1_post_class1_view'
    ];

    if (!channel_type || !validChannelTypes.includes(channel_type)) {
      return res.status(400).json({ error: '有効なチャンネルタイプを選択してください' });
    }

    // カテゴリの存在確認
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'カテゴリが見つかりません' });
    }

    const insertChannel = db.prepare(`
      INSERT INTO channels (name, description, category_id, channel_type) 
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertChannel.run(
      name.trim(), 
      description || '', 
      categoryId, 
      channel_type
    );

    // 作成されたチャンネルを取得
    const newChannel = db.prepare(`
      SELECT 
        c.*,
        0 as post_count
      FROM channels c
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      message: 'チャンネルが作成されました',
      channel: newChannel
    });
  } catch (error) {
    console.error('チャンネル作成エラー:', error);
    res.status(500).json({ error: 'チャンネルの作成に失敗しました' });
  }
});

// カテゴリを更新（管理者のみ）
router.put('/categories/:categoryId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'カテゴリ名を入力してください' });
    }

    const trimmedName = name.trim();

    // 既存のカテゴリをチェック（自分以外）
    const existingCategory = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(trimmedName, categoryId);
    if (existingCategory) {
      return res.status(400).json({ error: 'このカテゴリ名は既に存在します' });
    }

    const updateCategory = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
    const result = updateCategory.run(trimmedName, categoryId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'カテゴリが見つかりません' });
    }

    // 更新されたカテゴリを取得
    const updatedCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);

    res.json({
      message: 'カテゴリが更新されました',
      category: updatedCategory
    });
  } catch (error) {
    console.error('カテゴリ更新エラー:', error);
    res.status(500).json({ error: 'カテゴリの更新に失敗しました' });
  }
});

// チャンネルを更新（管理者のみ）
router.put('/channels/:channelId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description, channel_type } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'チャンネル名を入力してください' });
    }

    const validChannelTypes = [
      'admin_only_instructors_view',
      'admin_only_all_view', 
      'instructors_post_all_view',
      'all_post_all_view',
      'class1_post_class1_view'
    ];

    if (!channel_type || !validChannelTypes.includes(channel_type)) {
      return res.status(400).json({ error: '有効なチャンネルタイプを選択してください' });
    }

    const updateChannel = db.prepare(`
      UPDATE channels 
      SET name = ?, description = ?, channel_type = ? 
      WHERE id = ?
    `);
    
    const result = updateChannel.run(
      name.trim(), 
      description || '', 
      channel_type,
      channelId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'チャンネルが見つかりません' });
    }

    // 更新されたチャンネルを取得
    const updatedChannel = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM posts p WHERE p.channel_id = c.id) as post_count
      FROM channels c
      WHERE c.id = ?
    `).get(channelId);

    res.json({
      message: 'チャンネルが更新されました',
      channel: updatedChannel
    });
  } catch (error) {
    console.error('チャンネル更新エラー:', error);
    res.status(500).json({ error: 'チャンネルの更新に失敗しました' });
  }
});

// チャンネルを削除（管理者のみ）
router.delete('/channels/:channelId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { channelId } = req.params;

    const deleteChannel = db.prepare('DELETE FROM channels WHERE id = ?');
    const result = deleteChannel.run(channelId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'チャンネルが見つかりません' });
    }

    res.json({ message: 'チャンネルが削除されました' });
  } catch (error) {
    console.error('チャンネル削除エラー:', error);
    res.status(500).json({ error: 'チャンネルの削除に失敗しました' });
  }
});

// テスト用エンドポイント（並び替えAPIの動作確認）
router.get('/test', authenticateToken, requireAdmin, (req, res) => {
  try {
    console.log('=== テストエンドポイント開始 ===');
    console.log('リクエストURL:', req.url);
    console.log('リクエストメソッド:', req.method);
    console.log('ユーザー情報:', req.user);
    
    res.json({ 
      message: 'テストエンドポイント正常動作',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('テストエンドポイントエラー:', error);
    res.status(500).json({ 
      error: 'テストエンドポイントエラー',
      details: error.message
    });
  }
});

// 簡単な並び替えテストエンドポイント
router.post('/test-reorder', authenticateToken, requireAdmin, (req, res) => {
  try {
    console.log('=== 簡単な並び替えテスト開始 ===');
    console.log('リクエストボディ:', req.body);
    
    const { categoryIds } = req.body;
    
    if (!categoryIds || !Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'categoryIds配列が必要です' });
    }
    
    console.log('テスト用カテゴリID:', categoryIds);
    
    res.json({ 
      message: 'テスト成功',
      receivedIds: categoryIds,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('テスト並び替えエラー:', error);
    res.status(500).json({ 
      error: 'テスト並び替えエラー',
      details: error.message
    });
  }
});

// カテゴリの並び替え（管理者のみ）
router.put('/categories/reorder', authenticateToken, requireAdmin, (req, res) => {
  console.log('=== カテゴリ並び替えAPI開始 ===');
  console.log('リクエストボディ:', req.body);
  console.log('リクエストヘッダー:', req.headers);
  
  try {
    // リクエストボディの検証
    if (!req.body) {
      console.log('エラー: リクエストボディが存在しません');
      return res.status(400).json({ error: 'リクエストボディが必要です' });
    }

    if (!req.body.categoryIds) {
      console.log('エラー: categoryIdsが存在しません');
      return res.status(400).json({ error: 'categoryIdsが必要です' });
    }

    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      console.log('エラー: categoryIdsが配列ではありません');
      return res.status(400).json({ error: 'categoryIdsは配列である必要があります' });
    }

    if (categoryIds.length === 0) {
      console.log('エラー: categoryIdsが空です');
      return res.status(400).json({ error: 'categoryIdsは空であってはいけません' });
    }

    console.log('並び替え対象のカテゴリID:', categoryIds);

    // データベース接続
    const db = require('../database');

    // display_orderカラムの存在確認と追加
    const columns = db.prepare("PRAGMA table_info(categories)").all();
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('display_order')) {
      console.log('display_orderカラムを追加します');
      db.prepare('ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0').run();
    }

    // 並び替え処理
    const updateStmt = db.prepare('UPDATE categories SET display_order = ? WHERE id = ?');
    
    categoryIds.forEach((categoryId, index) => {
      console.log(`カテゴリID ${categoryId} を順序 ${index} に設定`);
      updateStmt.run(index, categoryId);
    });

    console.log('=== カテゴリ並び替えAPI完了 ===');
    
    res.json({ 
      message: 'カテゴリの並び順が更新されました',
      updatedCount: categoryIds.length
    });
  } catch (error) {
    console.error('カテゴリ並び替えエラー:', error);
    res.status(500).json({ 
      error: 'カテゴリの並び替えに失敗しました',
      details: error.message
    });
  }
});

// チャンネルの並び替え（管理者のみ）
router.put('/channels/reorder', authenticateToken, requireAdmin, (req, res) => {
  console.log('=== チャンネル並び替えAPI開始 ===');
  console.log('リクエストボディ:', req.body);
  console.log('リクエストヘッダー:', req.headers);
  
  try {
    // リクエストボディの検証
    if (!req.body) {
      console.log('エラー: リクエストボディが存在しません');
      return res.status(400).json({ error: 'リクエストボディが必要です' });
    }

    if (!req.body.channelIds) {
      console.log('エラー: channelIdsが存在しません');
      return res.status(400).json({ error: 'channelIdsが必要です' });
    }

    const { channelIds } = req.body;

    if (!Array.isArray(channelIds)) {
      console.log('エラー: channelIdsが配列ではありません');
      return res.status(400).json({ error: 'channelIdsは配列である必要があります' });
    }

    if (channelIds.length === 0) {
      console.log('エラー: channelIdsが空です');
      return res.status(400).json({ error: 'channelIdsは空であってはいけません' });
    }

    console.log('並び替え対象のチャンネルID:', channelIds);

    // データベース接続
    const db = require('../database');

    // display_orderカラムの存在確認と追加
    const columns = db.prepare("PRAGMA table_info(channels)").all();
    const columnNames = columns.map(col => col.name);
    
    if (!columnNames.includes('display_order')) {
      console.log('display_orderカラムを追加します');
      db.prepare('ALTER TABLE channels ADD COLUMN display_order INTEGER DEFAULT 0').run();
    }

    // 並び替え処理
    const updateStmt = db.prepare('UPDATE channels SET display_order = ? WHERE id = ?');
    
    channelIds.forEach((channelId, index) => {
      console.log(`チャンネルID ${channelId} を順序 ${index} に設定`);
      updateStmt.run(index, channelId);
    });

    console.log('=== チャンネル並び替えAPI完了 ===');
    
    res.json({ 
      message: 'チャンネルの並び順が更新されました',
      updatedCount: channelIds.length
    });
  } catch (error) {
    console.error('チャンネル並び替えエラー:', error);
    res.status(500).json({ 
      error: 'チャンネルの並び替えに失敗しました',
      details: error.message
    });
  }
});

module.exports = router; 