import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Bookmark as BookmarkIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  ContentPaste as ContentPasteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

interface SavedPost {
  id: number;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  saved_at: string;
  avatar_url?: string;
  is_study_log?: boolean;
  study_tags?: string;
  target_language?: string;
  ai_response_enabled?: boolean;
  comments?: Comment[];
  // マイ単語帳専用フィールド
  vocabulary_word?: string;
  vocabulary_meaning?: string;
  vocabulary_learning_content?: string;
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  created_at: string;
  avatar_url?: string;
  post_id: number;
}

const VocabularyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<SavedPost[]>([]);
  const [editingWord, setEditingWord] = useState<{ postId: number; word: string } | null>(null);
  const [editingMeaning, setEditingMeaning] = useState<{ postId: number; meaning: string } | null>(null);
  const [editingLearningContent, setEditingLearningContent] = useState<{ postId: number; content: string } | null>(null);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [pastedWord, setPastedWord] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  // 保存済み投稿を取得
  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/study-log/saved-posts-v2`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('=== Saved Posts Response ===');
      console.log('Response data:', response.data);
      console.log('Saved posts:', response.data.savedPosts);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.data.success) {
        // 各投稿のコメントを取得
        const postsWithComments = await Promise.all(
          response.data.savedPosts.map(async (post: SavedPost) => {
            try {
              console.log(`Fetching comments for post ${post.id}...`);
              console.log(`Post vocabulary data:`, {
                vocabulary_word: post.vocabulary_word,
                vocabulary_meaning: post.vocabulary_meaning,
                vocabulary_learning_content: post.vocabulary_learning_content
              });
              
              const commentsResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/posts/posts/${post.id}/comments`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              console.log(`Comments response for post ${post.id}:`, commentsResponse.data);
              
              if (commentsResponse.data.comments) {
                return { ...post, comments: commentsResponse.data.comments };
              }
            } catch (error) {
              console.log(`Comments fetch failed for post ${post.id}:`, error);
            }
            return { ...post, comments: [] };
          })
        );
        
        console.log('=== Final Posts with Comments ===');
        console.log('Posts with comments:', postsWithComments);
        setSavedPosts(postsWithComments);
        setFilteredPosts(postsWithComments);
      } else {
        setError('保存済み投稿の取得に失敗しました');
      }
    } catch (error: any) {
      console.error('保存済み投稿取得エラー:', error);
      setError('保存済み投稿の取得に失敗しました: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // マイ単語帳から削除
  const handleRemoveFromVocabulary = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${postId}/save`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // 削除成功後、リストを更新
        setSavedPosts(prev => prev.filter(post => post.id !== postId));
        setFilteredPosts(prev => prev.filter(post => post.id !== postId));
        alert('✅ マイ単語帳から削除しました');
      } else {
        alert('❌ 削除に失敗しました');
      }
    } catch (error: any) {
      console.error('削除エラー:', error);
      alert('❌ 削除に失敗しました: ' + (error.response?.data?.error || error.message));
    }
  };

  // 検索機能
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPosts(savedPosts);
      return;
    }

    const filtered = savedPosts.filter(post => {
      const word = post.vocabulary_word || post.content;
      const meaning = post.vocabulary_meaning || '';
      const learningContent = post.vocabulary_learning_content || post.content;
      
      return word.toLowerCase().includes(term.toLowerCase()) ||
             meaning.toLowerCase().includes(term.toLowerCase()) ||
             learningContent.toLowerCase().includes(term.toLowerCase()) ||
             post.username.toLowerCase().includes(term.toLowerCase()) ||
             (post.study_tags && JSON.parse(post.study_tags).some((tag: string) => 
               tag.toLowerCase().includes(term.toLowerCase())
             ));
    });
    
    setFilteredPosts(filtered);
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 単語・表現の編集
  const handleEditWord = (postId: number, currentWord: string) => {
    setEditingWord({ postId, word: currentWord });
  };

  const handleSaveWord = async () => {
    if (!editingWord) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingWord.postId}/vocabulary-word`,
        { word: editingWord.word },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEditingWord(null);
      alert('✅ 単語・表現を更新しました');
      
      // データを再取得して最新の状態を反映
      await fetchSavedPosts();
    } catch (error: any) {
      console.error('単語・表現更新エラー:', error);
      alert('❌ 単語・表現の更新に失敗しました');
    }
  };

  // 意味の編集
  const handleEditMeaning = (postId: number, currentMeaning: string) => {
    setEditingMeaning({ postId, meaning: currentMeaning });
  };

  const handleSaveMeaning = async () => {
    if (!editingMeaning) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingMeaning.postId}/vocabulary-meaning`,
        { meaning: editingMeaning.meaning },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEditingMeaning(null);
      alert('✅ 意味を更新しました');
      
      // データを再取得して最新の状態を反映
      await fetchSavedPosts();
    } catch (error: any) {
      console.error('意味更新エラー:', error);
      alert('❌ 意味の更新に失敗しました');
    }
  };

  // アコーディオンの開閉ハンドラー
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // 学習内容の編集
  const handleEditLearningContent = (postId: number, currentContent: string) => {
    setEditingLearningContent({ postId, content: currentContent });
  };

  const handleSaveLearningContent = async () => {
    if (!editingLearningContent) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/study-log/posts/${editingLearningContent.postId}/vocabulary-learning-content`,
        { content: editingLearningContent.content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setEditingLearningContent(null);
      alert('✅ 学習内容を更新しました');
      
      // データを再取得して最新の状態を反映
      await fetchSavedPosts();
    } catch (error: any) {
      console.error('学習内容更新エラー:', error);
      alert('❌ 学習内容の更新に失敗しました');
    }
  };

  // ペースト機能のハンドラー
  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setPastedContent(clipboardText);
      setShowPasteDialog(true);
    } catch (error) {
      console.error('クリップボード読み取りエラー:', error);
      alert('❌ クリップボードの読み取りに失敗しました');
    }
  };

  const handleSavePastedContent = async () => {
    if (!pastedWord.trim() || !pastedContent.trim()) {
      alert('❌ 単語と内容を入力してください');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/study-log/paste-vocabulary`,
        {
          word: pastedWord,
          content: pastedContent
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert('✅ マイ単語帳に保存しました！');
        setShowPasteDialog(false);
        setPastedContent('');
        setPastedWord('');
        fetchSavedPosts(); // 投稿一覧を再取得
      }
    } catch (error: any) {
      console.error('ペースト保存エラー:', error);
      alert('❌ 保存に失敗しました');
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookmarkIcon sx={{ color: 'secondary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {t('vocabulary')}
          </Typography>
        </Box>
      </Box>

      {/* 統計情報 */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: isDarkMode ? 'grey.800' : 'grey.50' }}>
        <Typography variant="body2" color="text.secondary">
          📚 {t('savedPosts')}: <strong>{savedPosts.length}</strong>件
          {searchTerm && (
            <>
              {' | '}{t('searchResults')}: <strong>{filteredPosts.length}</strong>件
            </>
          )}
        </Typography>
      </Paper>

      {/* 検索バーとペーストボタン */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          📖 マイ単語帳
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<ContentPasteIcon />}
            onClick={handlePasteFromClipboard}
            sx={{ 
              backgroundColor: 'secondary.main',
              '&:hover': {
                backgroundColor: 'secondary.dark'
              }
            }}
          >
            ペースト
          </Button>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 投稿一覧 */}
      {filteredPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BookmarkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {searchTerm ? t('noSearchResults') : t('vocabularyEmpty')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? t('tryDifferentKeyword')
              : t('vocabularyEmptyMessage')
            }
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredPosts.map((post) => {
            // マイ単語帳専用の値を取得（なければ元の値をフォールバック）
            const displayWord = post.vocabulary_word || post.content;
            const displayMeaning = post.vocabulary_meaning || '';
            const displayLearningContent = post.vocabulary_learning_content || post.content;
            
            console.log(`=== Rendering Post ${post.id} ===`);
            console.log('Post data:', {
              id: post.id,
              content: post.content,
              vocabulary_word: post.vocabulary_word,
              vocabulary_meaning: post.vocabulary_meaning,
              vocabulary_learning_content: post.vocabulary_learning_content
            });
            console.log('Display values:', {
              displayWord,
              displayMeaning,
              displayLearningContent
            });
            
            return (
              <Card key={post.id} sx={{ 
                border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: isDarkMode ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}>
                <CardContent sx={{ p: 2 }}>
                  {/* 単語・表現のヘッダー */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      {editingWord?.postId === post.id ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                          <TextField
                            size="small"
                            value={editingWord.word}
                            onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                            sx={{ flex: 1 }}
                          />
                          <Button size="small" onClick={handleSaveWord}>保存</Button>
                          <Button size="small" onClick={() => setEditingWord(null)}>キャンセル</Button>
                        </Box>
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {displayWord}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEditWord(post.id, displayWord)}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.saved_at)}
                      </Typography>
                      <Tooltip title={t('removeFromVocabulary')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFromVocabulary(post.id)}
                          sx={{
                            backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'grey.700' : 'grey.200'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* アコーディオンで詳細表示 */}
                  <Accordion 
                    expanded={expandedAccordion === `panel-${post.id}`}
                    onChange={handleAccordionChange(`panel-${post.id}`)}
                    sx={{ 
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        px: 0,
                        minHeight: '40px',
                        '& .MuiAccordionSummary-content': { margin: 0 }
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        詳細
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 0, pt: 1 }}>
                      {/* 意味表示 */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            📖 意味:
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEditMeaning(post.id, displayMeaning)}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingMeaning?.postId === post.id ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              size="small"
                              value={editingMeaning.meaning}
                              onChange={(e) => setEditingMeaning({ ...editingMeaning, meaning: e.target.value })}
                              sx={{ flex: 1 }}
                            />
                            <Button size="small" onClick={handleSaveMeaning}>保存</Button>
                            <Button size="small" onClick={() => setEditingMeaning(null)}>キャンセル</Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600,
                            color: 'primary.main',
                            backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                            padding: 1,
                            borderRadius: 1,
                            border: `1px solid ${isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`
                          }}>
                            {displayMeaning || '意味を記入してください'}
                          </Typography>
                        )}
                      </Box>

                      {/* 学習内容（フリースペース） */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            📝 学習内容:
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEditLearningContent(post.id, displayLearningContent)}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {editingLearningContent?.postId === post.id ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <TextField
                              multiline
                              rows={6}
                              value={editingLearningContent.content}
                              onChange={(e) => setEditingLearningContent({ ...editingLearningContent, content: e.target.value })}
                              size="small"
                              placeholder="Study BoardのAI学習サポートをコピペしたり、自分で自由に記入してください"
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" onClick={handleSaveLearningContent}>保存</Button>
                              <Button size="small" onClick={() => setEditingLearningContent(null)}>キャンセル</Button>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ 
                            whiteSpace: 'pre-line',
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            padding: 2,
                            borderRadius: 1,
                            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            minHeight: '60px'
                          }}>
                            {displayLearningContent || '学習内容を記入してください'}
                          </Typography>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* ペーストダイアログ */}
      <Dialog open={showPasteDialog} onClose={() => setShowPasteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>マイ単語帳にペースト</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="単語・表現"
              value={pastedWord}
              onChange={(e) => setPastedWord(e.target.value)}
              placeholder="例: fish, Let's go, こんにちは"
              fullWidth
            />
            <TextField
              label="学習内容"
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              multiline
              rows={8}
              fullWidth
              placeholder="学習した内容やメモをここに入力してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasteDialog(false)}>キャンセル</Button>
          <Button onClick={handleSavePastedContent} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VocabularyPage; 