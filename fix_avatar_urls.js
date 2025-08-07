const axios = require('axios');

// アバターURL修正スクリプト
async function fixAvatarUrls() {
  try {
    console.log('アバターURL修正を開始します...');
    
    const response = await axios.post('https://language-community-backend.onrender.com/api/auth/fix-avatar-urls', {}, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // 実際のトークンが必要
      }
    });
    
    console.log('修正結果:', response.data);
  } catch (error) {
    console.error('修正エラー:', error.response?.data || error.message);
  }
}

fixAvatarUrls(); 