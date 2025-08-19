const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { generateStudyLogResponse, extractLearningTags, extractMeaning } = require('../services/openaiService');

// データベース接続（SQLiteを使用）
const db = require('../database');

// 学習ログ投稿の作成
router.post('/channels/:channelId/study-posts', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, aiResponseEnabled = false, targetLanguage = 'English', image_url, is_anonymous = false } = req.body;
    
    console.log('=== Study Log Post Request ===');
    console.log('Channel ID:', channelId);
    console.log('Content:', content);
    console.log('AI Response Enabled:', aiResponseEnabled);
    console.log('Target Language:', targetLanguage);
    console.log('Raw req.user object:', JSON.stringify(req.user, null, 2));
    console.log('req.user exists:', !!req.user);
    console.log('req.user.userId:', req.user ? req.user.userId : 'undefined');
    console.log('req.user.id:', req.user ? req.user.id : 'undefined');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('================================');

    // ユーザーIDの堅牢な取得と検証
    let userId = null;
    
    if (req.user) {
      userId = req.user.userId || req.user.id;
      console.log('User ID resolution attempt 1:', userId);
      
      // 追加の検証：ユーザー情報を直接データベースから取得
      if (!userId && req.user.username) {
        console.log('Attempting to get user ID from username:', req.user.username);
        const userFromDb = db.prepare('SELECT id FROM users WHERE username = ?').get(req.user.username);
        if (userFromDb) {
          userId = userFromDb.id;
          console.log('User ID from database lookup:', userId);
        }
      }
    }

    console.log('Final resolved User ID:', userId);
    console.log('User ID type:', typeof userId);

    // ユーザーIDの最終検証
    if (!userId || isNaN(parseInt(userId))) {
      console.error('User ID validation failed');
      console.error('req.user full object:', req.user);
      throw new Error('有効なユーザーIDが取得できませんでした。再ログインしてください。');
    }

    // 数値型に変換
    const userIdNum = parseInt(userId);
    console.log('Converted User ID to number:', userIdNum);

    // 匿名投稿の処理
    let actualUserId = userIdNum;
    if (is_anonymous) {
      console.log('Anonymous post requested, creating Anonymous user...');
      
      // Anonymousユーザーを取得または作成
      let anonymousUser = db.prepare('SELECT id FROM users WHERE username = ?').get('Anonymous');
      
      if (!anonymousUser) {
        console.log('Anonymous user not found, creating new Anonymous user...');
        const anonymousUserResult = db.prepare(`
          INSERT INTO users (username, email, password, role, bio, created_at) 
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).run('Anonymous', 'anonymous@study-board.local', 'no-password', 'Anonymous', 'Anonymous Study Board User');
        
        anonymousUser = { id: anonymousUserResult.lastInsertRowid };
        console.log('Created Anonymous user with ID:', anonymousUser.id);
      } else {
        console.log('Anonymous user found with ID:', anonymousUser.id);
      }
      
      actualUserId = anonymousUser.id;
      console.log('Using Anonymous user ID for post:', actualUserId);
    }

    // タグの自動抽出（OpenAI APIエラーを完全に処理）
    let tags = [];
    let meaning = '';
    if (aiResponseEnabled) {
      try {
        if (process.env.OPENAI_API_KEY) {
          console.log('Attempting to extract tags and meaning...');
          [tags, meaning] = await Promise.all([
            extractLearningTags(content, targetLanguage),
            extractMeaning(content, targetLanguage)
          ]);
          console.log('Extracted tags:', tags);
          console.log('Extracted meaning:', meaning);
        } else {
          console.log('Skipping tag and meaning extraction - API key not set');
        }
      } catch (tagError) {
        console.error('Tag/meaning extraction failed, continuing without them:', tagError.message);
        // OpenAI APIエラーでも投稿は続行
        tags = [];
        meaning = '';
      }
    }

    // 学習ログ投稿を作成（SQLite型エラーを修正）
    console.log('Creating post in database...');
    console.log('Database parameters:', {
      content: content,
      user_id: actualUserId,
      channel_id: parseInt(channelId),
      is_study_log: 1,
      ai_response_enabled: aiResponseEnabled ? 1 : 0,
      study_tags: JSON.stringify(tags),
      study_meaning: meaning,
      target_language: targetLanguage,
      image_url: image_url || null
    });
    
    const result = db.prepare(`
      INSERT INTO posts (content, user_id, channel_id, is_study_log, ai_response_enabled, study_tags, study_meaning, target_language, image_url, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      content, 
      actualUserId, 
      parseInt(channelId), 
      1, // is_study_log = TRUE
      aiResponseEnabled ? 1 : 0, // ai_response_enabled
      JSON.stringify(tags), 
      meaning,
      targetLanguage, 
      image_url || null
    );

    const postId = result.lastInsertRowid;
    console.log('Post created with ID:', postId);

    // AI返信が有効な場合で、OpenAI APIキーが設定されている場合のみAI返信を生成
    if (aiResponseEnabled && process.env.OPENAI_API_KEY) {
      console.log('Generating AI response...');
      // 非同期でAI返信を生成（エラーが発生しても投稿は成功扱い）
      generateAIResponse(postId, content, targetLanguage).catch(error => {
        console.error('AI返信生成エラー:', error.message);
        console.log('AI response generation failed, but post was created successfully');
      });
    } else if (aiResponseEnabled && !process.env.OPENAI_API_KEY) {
      console.log('AI response requested but OpenAI API key not set');
    }

    // 投稿情報を取得して返す（テーブル不足に対応）
    console.log('Retrieving post data...');
    
    // まず基本的な投稿情報を取得
    const posts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `).all(postId);

    if (posts.length === 0) {
      throw new Error('投稿の取得に失敗しました');
    }

    // いいね数とコメント数を安全に取得（テーブルが存在しない場合は0）
    let likeCount = 0;
    let commentCount = 0;
    let userLiked = 0;

    try {
      const likeResult = db.prepare(`SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?`).get(postId);
      likeCount = likeResult ? likeResult.count : 0;
    } catch (error) {
      console.log('post_likes table not found, setting like_count to 0');
      likeCount = 0;
    }

    try {
      const commentResult = db.prepare(`SELECT COUNT(*) as count FROM comments WHERE post_id = ?`).get(postId);
      commentCount = commentResult ? commentResult.count : 0;
    } catch (error) {
      console.log('comments table not found, setting comment_count to 0');
      commentCount = 0;
    }

    try {
      const userLikeResult = db.prepare(`SELECT COUNT(*) as count FROM post_likes WHERE post_id = ? AND user_id = ?`).get(postId, userIdNum);
      userLiked = userLikeResult ? userLikeResult.count : 0;
    } catch (error) {
      console.log('post_likes table not found, setting user_liked to 0');
      userLiked = 0;
    }

    // 投稿オブジェクトにカウントを追加
    const post = {
      ...posts[0],
      like_count: likeCount,
      comment_count: commentCount,
      user_liked: userLiked
    };

    console.log('Post retrieved successfully');
    console.log('=== Study Log Post Response ===');
    console.log('Success:', true);
    console.log('Post ID:', post.id);
    console.log('Tags:', tags);
    console.log('================================');

    res.json({
      success: true,
      post: post,
      tags: tags,
      aiEnabled: aiResponseEnabled && !!process.env.OPENAI_API_KEY,
      message: 'Study log posted successfully!'
    });

  } catch (error) {
    console.error('学習ログ投稿作成エラー:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({ 
      error: '学習ログ投稿の作成に失敗しました',
      details: error.message 
    });
  }
});

// AI返信を非同期で生成する関数
async function generateAIResponse(postId, content, targetLanguage) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key not set, skipping AI response generation');
      return;
    }

    console.log(`=== AI Response Generation Start ===`);
    console.log(`Post ID: ${postId}`);
    console.log(`Content: ${content}`);
    console.log(`Target Language: ${targetLanguage}`);
    console.log(`API Key exists: ${!!process.env.OPENAI_API_KEY}`);

    const aiResponse = await generateStudyLogResponse(content, targetLanguage);
    console.log(`AI response received:`, aiResponse);
    
    // AI返信をデータベースに保存
    console.log('Saving AI response to ai_responses table...');
    const aiResponseResult = db.prepare(`
      INSERT INTO ai_responses (post_id, content, response_type, target_language, generated_at) 
      VALUES (?, ?, 'study_support', ?, datetime('now'))
    `).run(postId, aiResponse.content, targetLanguage);
    console.log('AI response saved to ai_responses table:', aiResponseResult);

    // AI返信をコメントとしても投稿に追加
    try {
      console.log('Creating AI user for comment...');
      
      // AIユーザーを取得または作成
      let aiUser = db.prepare('SELECT id FROM users WHERE username = ?').get('AI学習サポート');
      
      if (!aiUser) {
        console.log('AI user not found, creating new AI user...');
        // AIユーザーを作成
        const aiUserResult = db.prepare(`
          INSERT INTO users (username, email, password, role, bio, created_at) 
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).run('AI学習サポート', 'ai@study-support.local', 'no-password', 'AI', 'AI学習サポートBot');
        
        aiUser = { id: aiUserResult.lastInsertRowid };
        console.log('Created AI user with ID:', aiUser.id);
      } else {
        console.log('AI user found with ID:', aiUser.id);
      }

      // AI返信をコメントとして追加
      console.log('Adding AI response as comment...');
      console.log('Comment parameters:', {
        content: aiResponse.content,
        user_id: aiUser.id,
        post_id: postId
      });
      
      const commentResult = db.prepare(`
        INSERT INTO comments (content, user_id, post_id, created_at) 
        VALUES (?, ?, ?, datetime('now'))
      `).run(aiResponse.content, aiUser.id, postId);
      
      console.log('AI comment created with result:', commentResult);
      console.log(`AI返信をコメントとして追加しました - Post ID: ${postId}, Comment ID: ${commentResult.lastInsertRowid}`);
      
    } catch (commentError) {
      console.error('=== AI Comment Creation Error ===');
      console.error('Error type:', commentError.constructor.name);
      console.error('Error message:', commentError.message);
      console.error('Error stack:', commentError.stack);
      console.error('Comment error details:', {
        postId: postId,
        aiResponseContent: aiResponse.content,
        aiResponseLength: aiResponse.content?.length
      });
    }

    console.log(`=== AI Response Generation Complete ===`);
    console.log(`Post ID: ${postId} - AI response and comment successfully created`);
  } catch (error) {
    console.error('=== AI Response Generation Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Generation error details:', {
      postId: postId,
      content: content,
      targetLanguage: targetLanguage
    });
  }
}

// 投稿をマイ単語帳に保存
router.post('/posts/:postId/save', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId || req.user.id;

    console.log('=== Save to Vocabulary Request ===');
    console.log('Post ID:', postId);
    console.log('User ID:', userId);

    if (!userId || isNaN(parseInt(userId))) {
      throw new Error('有効なユーザーIDが取得できませんでした');
    }

    // 既に保存済みかチェック
    const existingSave = db.prepare('SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?').get(parseInt(userId), parseInt(postId));
    
    if (existingSave) {
      return res.json({ 
        success: true, 
        message: '既にマイ単語帳に保存済みです',
        alreadySaved: true 
      });
    }

    // マイ単語帳に保存
    db.prepare(`
      INSERT INTO saved_posts (user_id, post_id, saved_at) 
      VALUES (?, ?, datetime('now'))
    `).run(parseInt(userId), parseInt(postId));

    console.log('Post saved to vocabulary successfully');
    res.json({ 
      success: true, 
      message: 'マイ単語帳に保存しました！' 
    });

  } catch (error) {
    console.error('マイ単語帳保存エラー:', error);
    res.status(500).json({ 
      error: 'マイ単語帳への保存に失敗しました',
      details: error.message 
    });
  }
});

// マイ単語帳から削除
router.delete('/posts/:postId/save', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId || req.user.id;

    if (!userId || isNaN(parseInt(userId))) {
      throw new Error('有効なユーザーIDが取得できませんでした');
    }

    db.prepare('DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?').run(parseInt(userId), parseInt(postId));

    res.json({ 
      success: true, 
      message: 'マイ単語帳から削除しました' 
    });

  } catch (error) {
    console.error('マイ単語帳削除エラー:', error);
    res.status(500).json({ 
      error: 'マイ単語帳からの削除に失敗しました',
      details: error.message 
    });
  }
});

// 保存済み投稿一覧取得
router.get('/saved-posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    if (!userId || isNaN(parseInt(userId))) {
      throw new Error('有効なユーザーIDが取得できませんでした');
    }

    const savedPosts = db.prepare(`
      SELECT p.*, u.username, u.avatar_url, sp.saved_at
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id  
      JOIN users u ON p.user_id = u.id
      WHERE sp.user_id = ?
      ORDER BY sp.saved_at DESC
    `).all(parseInt(userId));

    res.json({ 
      success: true, 
      savedPosts: savedPosts 
    });

  } catch (error) {
    console.error('保存済み投稿取得エラー:', error);
    res.status(500).json({ 
      error: '保存済み投稿の取得に失敗しました',
      details: error.message 
    });
  }
});

// AI返信取得
router.get('/posts/:postId/ai-response', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    console.log('=== AI Response Request ===');
    console.log('Post ID:', postId);

    const aiResponse = db.prepare(`
      SELECT * FROM ai_responses 
      WHERE post_id = ? 
      ORDER BY generated_at DESC 
      LIMIT 1
    `).get(parseInt(postId));

    if (!aiResponse) {
      return res.json({ 
        success: true, 
        aiResponse: null,
        message: 'AI返信が見つかりません' 
      });
    }

    res.json({ 
      success: true, 
      aiResponse: aiResponse 
    });

  } catch (error) {
    console.error('AI返信取得エラー:', error);
    res.status(500).json({ 
      error: 'AI返信の取得に失敗しました',
      details: error.message 
    });
  }
});

// 表現の解説を更新
router.put('/posts/:postId/expression-analysis', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { analysis } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Updating expression analysis for post:', postId);
    console.log('New analysis:', analysis);
    console.log('User ID:', userId);

    // AIコメントを更新
    const aiUser = db.prepare('SELECT id FROM users WHERE username = ?').get('AI学習サポート');
    if (aiUser) {
      const comment = db.prepare('SELECT * FROM comments WHERE post_id = ? AND user_id = ?').get(postId, aiUser.id);
      if (comment) {
        // 既存のコメント内容を取得して表現の解説部分のみを更新
        const updatedContent = comment.content.replace(
          /📝 \*\*表現の解説\*\*\n([\s\S]*?)(?=💡 \*\*例文\*\*|📚 \*\*関連表現\*\*|$)/,
          `📝 **表現の解説**\n${analysis}\n`
        );
        
        db.prepare('UPDATE comments SET content = ? WHERE id = ?').run(updatedContent, comment.id);
        console.log('Expression analysis updated successfully');
      }
    }

    res.json({ success: true, message: '表現の解説を更新しました' });
  } catch (error) {
    console.error('Expression analysis update error:', error);
    res.status(500).json({ success: false, message: '表現の解説の更新に失敗しました' });
  }
});

// 例文を更新
router.put('/posts/:postId/examples', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { examples } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Updating examples for post:', postId);
    console.log('New examples:', examples);
    console.log('User ID:', userId);

    // AIコメントを更新
    const aiUser = db.prepare('SELECT id FROM users WHERE username = ?').get('AI学習サポート');
    if (aiUser) {
      const comment = db.prepare('SELECT * FROM comments WHERE post_id = ? AND user_id = ?').get(postId, aiUser.id);
      if (comment) {
        // 既存のコメント内容を取得して例文部分のみを更新
        const updatedContent = comment.content.replace(
          /💡 \*\*例文\*\*\n([\s\S]*?)(?=📚 \*\*関連表現\*\*|$)/,
          `💡 **例文**\n${examples}\n`
        );
        
        db.prepare('UPDATE comments SET content = ? WHERE id = ?').run(updatedContent, comment.id);
        console.log('Examples updated successfully');
      }
    }

    res.json({ success: true, message: '例文を更新しました' });
  } catch (error) {
    console.error('Examples update error:', error);
    res.status(500).json({ success: false, message: '例文の更新に失敗しました' });
  }
});

// 意味を更新
router.put('/posts/:postId/meaning', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { meaning } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Updating meaning for post:', postId);
    console.log('New meaning:', meaning);
    console.log('User ID:', userId);

    // 投稿の意味を更新
    db.prepare('UPDATE posts SET study_meaning = ? WHERE id = ?').run(meaning, postId);
    console.log('Meaning updated successfully');

    res.json({ success: true, message: '意味を更新しました' });
  } catch (error) {
    console.error('Meaning update error:', error);
    res.status(500).json({ success: false, message: '意味の更新に失敗しました' });
  }
});

// 関連表現を更新
router.put('/posts/:postId/related-expressions', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { expressions } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Updating related expressions for post:', postId);
    console.log('New expressions:', expressions);
    console.log('User ID:', userId);

    // AIコメントを更新
    const aiUser = db.prepare('SELECT id FROM users WHERE username = ?').get('AI学習サポート');
    if (aiUser) {
      const comment = db.prepare('SELECT * FROM comments WHERE post_id = ? AND user_id = ?').get(postId, aiUser.id);
      if (comment) {
        // 既存のコメント内容を取得して関連表現部分のみを更新
        const updatedContent = comment.content.replace(
          /📚 \*\*関連表現\*\*\n([\s\S]*?)(?=\n\n|$)/,
          `📚 **関連表現**\n${expressions.map(exp => `- ${exp}`).join('\n')}\n`
        );
        
        db.prepare('UPDATE comments SET content = ? WHERE id = ?').run(updatedContent, comment.id);
        console.log('Related expressions updated successfully');
      }
    }

    res.json({ success: true, message: '関連表現を更新しました' });
  } catch (error) {
    console.error('Related expressions update error:', error);
    res.status(500).json({ success: false, message: '関連表現の更新に失敗しました' });
  }
});

// ペーストした内容をマイ単語帳に保存
router.post('/paste-vocabulary', authenticateToken, async (req, res) => {
  try {
    const { word, content } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('Pasting vocabulary content...');
    console.log('Word:', word);
    console.log('Content:', content);
    console.log('User ID:', userId);

    if (!word || !content) {
      return res.status(400).json({ success: false, message: '単語と内容が必要です' });
    }

    // 新しい投稿を作成（AI学習サポートコメントは作成しない）
    const result = db.prepare(`
      INSERT INTO posts (content, user_id, channel_id, is_study_log, ai_response_enabled, created_at) 
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(
      word, 
      userId, 
      19, // Study BoardチャンネルID
      1, // is_study_log = TRUE
      0  // ai_response_enabled = FALSE（ペーストした内容なので）
    );

    const postId = result.lastInsertRowid;

    // マイ単語帳に保存
    db.prepare(`
      INSERT INTO saved_posts (user_id, post_id, saved_at)
      VALUES (?, ?, datetime('now'))
    `).run(userId, postId);

    console.log('Vocabulary content pasted successfully');
    res.json({ success: true, message: 'マイ単語帳に保存しました' });

  } catch (error) {
    console.error('Paste vocabulary error:', error);
    res.status(500).json({ success: false, message: '保存に失敗しました' });
  }
});

module.exports = router; 