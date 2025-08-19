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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Bookmark as BookmarkIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
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

  // 保存済み投稿を取得
  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/study-log/saved-posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSavedPosts(response.data.savedPosts);
        setFilteredPosts(response.data.savedPosts);
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

    const filtered = savedPosts.filter(post => 
      post.content.toLowerCase().includes(term.toLowerCase()) ||
      post.username.toLowerCase().includes(term.toLowerCase()) ||
      (post.study_tags && JSON.parse(post.study_tags).some((tag: string) => 
        tag.toLowerCase().includes(term.toLowerCase())
      ))
    );
    
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

  // URLをリンクに変換
  const convertUrlsToLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: underline;">${url}</a>`;
    });
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

      {/* 検索バー */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSearch('')} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
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
          {filteredPosts.map((post) => (
            <Card key={post.id} sx={{ 
              border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
              '&:hover': {
                boxShadow: isDarkMode ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 20px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent>
                {/* 投稿ヘッダー */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar 
                    sx={{ bgcolor: 'primary.main' }}
                    src={post.avatar_url}
                  >
                    {post.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {post.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      投稿: {formatDate(post.created_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      保存: {formatDate(post.saved_at)}
                    </Typography>
                  </Box>
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

                {/* 投稿内容 */}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 2,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                  dangerouslySetInnerHTML={{ __html: convertUrlsToLinks(post.content) }}
                />

                {/* Study Board用のタグ表示 */}
                {post.is_study_log && post.study_tags && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      🏷️ 学習タグ:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {(() => {
                        try {
                          const tags = JSON.parse(post.study_tags);
                          return tags.map((tag: string, index: number) => (
                            <Chip 
                              key={index} 
                              label={tag} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                borderColor: 'primary.main',
                                color: 'primary.main'
                              }}
                            />
                          ));
                        } catch {
                          return null;
                        }
                      })()}
                    </Box>
                  </Box>
                )}

                {/* Study Board用のAI返信表示 */}
                {post.is_study_log && post.ai_response_enabled && (
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      icon={<AutoAwesomeIcon />}
                      label={`🤖 AI学習サポート有効 | 学習言語: ${post.target_language === 'English' ? '英語' : '日本語'}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* アクションボタン */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                                     <Button
                     size="small"
                     variant="outlined"
                     onClick={() => navigate(`/channel/19`)}
                     sx={{ fontSize: '0.75rem' }}
                   >
                     {t('backToStudyBoard')}
                   </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default VocabularyPage; 