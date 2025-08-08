// 本番環境用のテスト投稿削除スクリプト
// Renderの環境で実行されることを想定

const sqlite3 = require('better-sqlite3');
const path = require('path');

// 本番環境のデータベースパス
const dbPath = path.join(__dirname, 'language-community.db');
const db = sqlite3(dbPath);

console.log('本番環境のテスト投稿を削除します...');
console.log('データベースパス:', dbPath);

try {
  // 削除対象の投稿を確認
  const targetPosts = db.prepare(`
    SELECT id, content, created_at 
    FROM posts 
    WHERE content IN ('テストイベント2', 'TESTTESTAAA')
  `).all();
  
  console.log('削除対象の投稿:');
  targetPosts.forEach(post => {
    console.log(`- ID: ${post.id}, 内容: ${post.content}, 作成日時: ${post.created_at}`);
  });
  
  if (targetPosts.length === 0) {
    console.log('削除対象の投稿が見つかりませんでした。');
    return;
  }
  
  // テスト投稿を削除
  const deleteTestPosts = db.prepare(`
    DELETE FROM posts 
    WHERE content IN ('テストイベント2', 'TESTTESTAAA')
  `);
  
  const result = deleteTestPosts.run();
  
  console.log('削除結果:', result);
  console.log(`削除された投稿数: ${result.changes}`);
  
  // 残りの投稿を確認
  const remainingPosts = db.prepare(`
    SELECT id, content, created_at 
    FROM posts 
    ORDER BY created_at DESC
  `).all();
  
  console.log('残りの投稿:');
  remainingPosts.forEach(post => {
    console.log(`- ID: ${post.id}, 内容: ${post.content}, 作成日時: ${post.created_at}`);
  });
  
  console.log('本番環境のテスト投稿削除が完了しました。');
} catch (error) {
  console.error('エラーが発生しました:', error);
} finally {
  db.close();
} 