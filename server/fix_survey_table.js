const Database = require('better-sqlite3');
const path = require('path');

// データベースパスの設定
let dbPath;
if (process.env.DATABASE_PATH) {
  dbPath = process.env.DATABASE_PATH;
} else if (process.env.NODE_ENV === 'production') {
  // Renderの永続化ディスクを使用
  dbPath = '/opt/render/data/language-community.db';
} else {
  // 開発環境
  dbPath = path.join(__dirname, 'language-community.db');
}

console.log('🔧 FIX SURVEY TABLE: Database path:', dbPath);

const db = new Database(dbPath);

// surveysテーブルのUNIQUE制約を修正
const fixSurveyTable = () => {
  try {
    console.log('🚀 STARTING SURVEY TABLE FIX...');
    
    // 1. 現在のテーブル構造を確認
    const columns = db.prepare(`
      PRAGMA table_info(surveys)
    `).all();
    
    console.log('Current surveys table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (not null: ${col.notnull}, pk: ${col.pk})`);
    });
    
    // 2. 現在のインデックスを確認
    const indexes = db.prepare(`
      PRAGMA index_list(surveys)
    `).all();
    
    console.log('\nCurrent indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });
    
    // 3. 問題のあるUNIQUE制約を削除
    const problematicIndex = indexes.find(index => 
      index.name.includes('user_id') || index.name.includes('sqlite_autoindex')
    );
    
    if (problematicIndex) {
      console.log(`\n❌ Found problematic index: ${problematicIndex.name}`);
      console.log('Dropping problematic index...');
      
      db.prepare(`DROP INDEX IF EXISTS ${problematicIndex.name}`).run();
      console.log('✅ Problematic index dropped');
    }
    
    // 4. 正しいUNIQUE制約を追加
    console.log('\n🔧 Adding correct UNIQUE constraint...');
    
    try {
      db.prepare(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_surveys_member_month 
        ON surveys(member_number, month)
      `).run();
      console.log('✅ Correct UNIQUE constraint added');
    } catch (error) {
      console.log('⚠️  UNIQUE constraint might already exist:', error.message);
    }
    
    // 5. 最終確認
    const finalIndexes = db.prepare(`
      PRAGMA index_list(surveys)
    `).all();
    
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}`);
    });
    
    // 6. 既存データの確認
    const existingSurveys = db.prepare(`
      SELECT id, user_id, member_number, month, created_at 
      FROM surveys 
      ORDER BY created_at DESC
    `).all();
    
    console.log('\n📊 Existing survey data:');
    existingSurveys.forEach(survey => {
      console.log(`  - ID: ${survey.id}, User: ${survey.user_id}, Member: ${survey.member_number}, Month: ${survey.month}`);
    });
    
    console.log('\n✅ SURVEY TABLE FIX COMPLETED SUCCESSFULLY!');
    console.log('🔄 Please try submitting the survey again.');
    
  } catch (error) {
    console.error('❌ SURVEY TABLE FIX ERROR:', error);
    throw error;
  } finally {
    db.close();
  }
};

// 修正を実行
fixSurveyTable(); 