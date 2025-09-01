const Database = require('better-sqlite3');
const path = require('path');

// データベースパスを設定
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/data/language-community.db'
  : path.join(__dirname, 'language-community.db');

console.log('データベースパス:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('=== カバー画像データ修正スクリプト開始 ===');
  
  // 現在のcover_imageの状態を確認
  const events = db.prepare('SELECT id, title, cover_image FROM events WHERE cover_image IS NOT NULL AND cover_image != ""').all();
  console.log('カバー画像を持つイベント数:', events.length);
  
  if (events.length === 0) {
    console.log('修正対象のイベントがありません');
    db.close();
    process.exit(0);
  }
  
  let fixedCount = 0;
  
  events.forEach(event => {
    console.log(`\n--- イベント ${event.id}: ${event.title} ---`);
    console.log('現在のcover_image長さ:', event.cover_image.length);
    console.log('現在のcover_image開始部分:', event.cover_image.substring(0, 80) + '...');
    
    // /uploads/data: で始まる場合は修正
    if (event.cover_image.startsWith('/uploads/data:')) {
      const corrected = event.cover_image.replace('/uploads/', '');
      console.log('🔧 修正が必要です');
      console.log('修正前長さ:', event.cover_image.length);
      console.log('修正後長さ:', corrected.length);
      console.log('修正後開始部分:', corrected.substring(0, 80) + '...');
      
      // データベースを更新
      const result = db.prepare('UPDATE events SET cover_image = ? WHERE id = ?').run(corrected, event.id);
      if (result.changes > 0) {
        console.log('✅ 修正完了:', event.id);
        fixedCount++;
      } else {
        console.log('❌ 修正失敗:', event.id);
      }
    } else if (event.cover_image.startsWith('data:')) {
      console.log('✅ 既に正しい形式（data:で開始）');
    } else {
      console.log('🤔 別の形式:', event.cover_image.substring(0, 50));
    }
  });
  
  console.log(`\n=== 修正完了 ===`);
  console.log(`修正されたイベント数: ${fixedCount}`);
  console.log(`修正不要なイベント数: ${events.length - fixedCount}`);
  
  db.close();
  console.log('データベース接続を閉じました');
  
} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
} 