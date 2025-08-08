const db = require('./database');

console.log('テスト投稿の削除を開始します...');

try {
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
  
  console.log('テスト投稿の削除が完了しました。');
} catch (error) {
  console.error('エラーが発生しました:', error);
} 