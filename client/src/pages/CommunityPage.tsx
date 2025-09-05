import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Fade,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
  InputBase,
  IconButton,
  Grid,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Language,
  Search as SearchIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useCommunity } from '../contexts/CommunityContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavoriteChannel } from '../contexts/FavoriteChannelContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SetupGuide from '../components/SetupGuide/SetupGuide';
import FavoriteChannelDialog from '../components/FavoriteChannelDialog/FavoriteChannelDialog';
import axios from 'axios'; // axiosを追加

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const {
    categories,
    channels,
    loadCategories,
    loadChannels,
    toggleCategory,
  } = useCommunity();
  const { favoriteChannel, setFavoriteChannel } = useFavoriteChannel();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteChannelDialogOpen, setFavoriteChannelDialogOpen] = useState(false);
  const hasLoaded = useRef(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const { t } = useTranslation();

  // Diary投稿機能の状態管理
  const [diaryPostModalOpen, setDiaryPostModalOpen] = useState(false);
  const [diaryPostContent, setDiaryPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!hasLoaded.current) {
      console.log('CommunityPage: loadCategories called (first time)');
      loadCategories();
      hasLoaded.current = true;
    }
  }, [loadCategories]); // loadCategoriesを依存配列に追加

  // カテゴリが読み込まれた時に、開いた状態のカテゴリのチャンネルを自動的に読み込む
  useEffect(() => {
    if (categories.length > 0) {
      console.log('Categories loaded, checking for expanded categories');
      const expandedCategories = categories.filter(cat => !cat.is_collapsed);
      console.log('Expanded categories found:', expandedCategories.map(cat => cat.name));
      
      // 開いた状態のカテゴリのチャンネルを読み込む
      expandedCategories.forEach(category => {
        if (!channels[category.id] || channels[category.id].length === 0) {
          console.log(`Loading channels for expanded category: ${category.name}`);
          loadChannels(category.id);
        }
      });
    }
  }, [categories, channels, loadChannels]);

  const handleCategoryToggle = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && !category.is_collapsed) {
      // カテゴリを展開する時にチャンネルを読み込む
      loadChannels(categoryId);
    }
    toggleCategory(categoryId);
    // expandedCategoriesの状態も更新
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleChannelClick = (channelId: number) => {
    navigate(`/channel/${channelId}`);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFavoriteChannel = () => {
    if (favoriteChannel) {
      // お気に入りチャンネルが設定されている場合は直接遷移
      navigate(`/channel/${favoriteChannel.id}`);
    } else {
      // お気に入りチャンネルが設定されていない場合はダイアログを開く
      setFavoriteChannelDialogOpen(true);
    }
  };

  const handleEditFavoriteChannel = (e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素のクリックイベントを防ぐ
    setFavoriteChannelDialogOpen(true);
  };

  const handleFeatures = () => {
    navigate('/features');
  };

  const getChannelTypeLabel = (channelType: string) => {
    switch (channelType) {
      case 'admin_only_instructors_view':
        return t('channelTypeStaffOnly');
      case 'admin_only_all_view':
        return t('channelTypeAnnouncement');
      case 'instructors_post_all_view':
        return t('channelTypeInstructorPost');
      case 'all_post_all_view':
        return t('channelTypeGeneralPost');
      case 'class1_post_class1_view':
        return t('channelTypeClass1Only');
      default:
        return t('unknown');
    }
  };

  const getChannelTypeColor = (channelType: string) => {
    switch (channelType) {
      case 'admin_only_instructors_view':
        return 'error';
      case 'admin_only_all_view':
        return 'warning';
      case 'instructors_post_all_view':
        return 'info';
      case 'all_post_all_view':
        return 'success';
      case 'class1_post_class1_view':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'サーバー管理者':
        return '#dc2626';
      case 'ECG講師':
      case 'JCG講師':
        return '#ea580c';
      case 'Class1 Members':
        return '#7c3aed';
      case 'ECGメンバー':
      case 'JCGメンバー':
        return '#2563eb';
      case 'Trial参加者':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  // Diary投稿処理
  const handleDiaryPost = async () => {
    if (!diaryPostContent.trim()) {
      setError('投稿内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // DiaryチャンネルのID（18）に投稿
      await axios.post('/api/posts/channels/18/posts', {
        content: diaryPostContent.trim(),
        image_url: selectedImage
      });

      // 成功時の処理
      setDiaryPostContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setDiaryPostModalOpen(false);
      
      // Diaryチャンネルに遷移
      navigate('/channel/18');
    } catch (error: any) {
      console.error('Diary投稿エラー:', error);
      setError(error.response?.data?.error || 'Diary投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 画像選択処理
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('画像サイズは10MB以下にしてください');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setImagePreview(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // 画像削除処理
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };


  return (
    <Box
      sx={{
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4, md: 6 } }}>
        <Fade in timeout={800}>
          <Box>
            {/* ヘッダーセクション */}
            <Box sx={{ mb: { xs: 4, sm: 5, md: 6 }, textAlign: 'center' }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{
                  fontWeight: 800,
                  mb: 2,
                }}
              >
                {t('membersCommunity')}
              </Typography>
              
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                {t('communityWelcome', { username: user?.username })}
              </Typography>
              
              {/* 検索バー */}
              <Paper
                elevation={0}
                sx={{
                  maxWidth: 600,
                  mx: 'auto',
                  mb: { xs: 3, sm: 4 },
                  borderRadius: 3,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleSearch}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <InputBase
                    placeholder={t('communitySearchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                      flex: 1,
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '& .MuiInputBase-input': {
                        '&::placeholder': {
                          opacity: 1,
                        },
                      },
                    }}
                  />
                  <IconButton
                    type="submit"
                    sx={{
                      p: { xs: 1, sm: 1.5 },
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Box>
              </Paper>

              {/* お気に入りチャンネルボタン */}
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(30, 64, 175, 0.04)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                  onClick={handleFavoriteChannel}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <StarIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {favoriteChannel ? favoriteChannel.name : t('favoriteChannel')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {favoriteChannel ? t('favoriteChannelDescription') : t('noFavoriteChannel')}
                    </Typography>
                    
                    {/* 編集ボタン（お気に入りチャンネルが設定されている場合のみ表示） */}
                    {favoriteChannel && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                        }}
                      >
                        <Tooltip title={t('editFavoriteChannel')} arrow>
                          <IconButton
                            size="small"
                            onClick={handleEditFavoriteChannel}
                            sx={{
                              backgroundColor: (theme) => 
                                theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(0, 0, 0, 0.04)',
                              color: 'text.primary',
                              border: (theme) => 
                                theme.palette.mode === 'dark' 
                                  ? '1px solid rgba(255, 255, 255, 0.2)' 
                                  : '1px solid rgba(0, 0, 0, 0.12)',
                              '&:hover': {
                                backgroundColor: (theme) => 
                                  theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.2)' 
                                    : 'rgba(0, 0, 0, 0.08)',
                                border: (theme) => 
                                  theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(255, 255, 255, 0.3)' 
                                    : '1px solid rgba(0, 0, 0, 0.2)',
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                              width: 32,
                              height: 32,
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* セットアップガイド */}
              <SetupGuide />

              {/* このコミュニティでできることボタン */}
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(30, 64, 175, 0.04)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                  }}
                  onClick={handleFeatures}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <InfoIcon sx={{ fontSize: { xs: 24, sm: 28 }, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight={600}>
                        {t('whatYouCanDo')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('whatYouCanDoDescription')}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* カテゴリセクション */}
            <Stack spacing={{ xs: 2, sm: 3 }}>
              {categories.map((category) => (
                <Fade in key={category.id} timeout={800} style={{ transitionDelay: `${category.id * 100}ms` }}>
                  <Card 
                    elevation={0}
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      },
                    }}
                  >
                    <Accordion
                      expanded={!category.is_collapsed}
                      onChange={() => handleCategoryToggle(category.id)}
                      sx={{
                        '&:before': { display: 'none' },
                        '& .MuiAccordionSummary-root': {
                          minHeight: { xs: 56, sm: 64 },
                        },
                        '& .MuiAccordionSummary-content': {
                          margin: { xs: '8px 0', sm: '12px 0' },
                        },
                        '& .MuiAccordionDetails-root': {
                          padding: { xs: '8px 16px 16px', sm: '16px 24px 24px' },
                        },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          '& .MuiAccordionSummary-expandIconWrapper': {
                            color: 'text.secondary',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '1rem', sm: '1.125rem' },
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${channels[category.id]?.length || 0} ${t('communityChannels')}`}
                            size="small"
                            sx={{
                              ml: 'auto',
                              mr: 2,
                              fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={{ xs: 1, sm: 2 }}>
                          {channels[category.id]?.map((channel) => (
                            <Grid item xs={12} sm={6} md={4} key={channel.id}>
                              <Card
                                elevation={0}
                                sx={{
                                  cursor: 'pointer',
                                  border: '1px solid rgba(0, 0, 0, 0.06)',
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid rgba(30, 64, 175, 0.2)',
                                  },
                                }}
                                onClick={() => handleChannelClick(channel.id)}
                              >
                                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      sx={{ 
                                        fontWeight: 600,
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        flex: 1,
                                        color: 'text.primary',
                                      }}
                                    >
                                      {channel.name}
                                    </Typography>
                                    <Chip
                                      label={getChannelTypeLabel(channel.channel_type)}
                                      color={getChannelTypeColor(channel.channel_type) as any}
                                      size="small"
                                      sx={{
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                        height: { xs: 20, sm: 24 },
                                      }}
                                    />
                                  </Box>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {channel.description || '説明なし'}
                                  </Typography>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Card>
                </Fade>
              ))}
            </Stack>

            {categories.length === 0 && (
              <Fade in timeout={800}>
                <Card sx={{ mt: 6, borderRadius: 3 }}>
                  <CardContent sx={{ textAlign: 'center', py: 8 }}>
                    <Language sx={{ fontSize: 72, color: 'text.disabled', mb: 3 }} />
                    <Typography variant="h4" color="text.secondary" gutterBottom fontWeight={600}>
                      {t('noCategories')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {t('waitAdmin')}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Box>
        </Fade>
      </Container>

      {/* お気に入りチャンネル選択ダイアログ */}
      <FavoriteChannelDialog
        open={favoriteChannelDialogOpen}
        onClose={() => setFavoriteChannelDialogOpen(false)}
      />

      {/* Diary投稿用フローティングボタン */}
      {user && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={() => setDiaryPostModalOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Diary投稿モーダル */}
      <Dialog
        open={diaryPostModalOpen}
        onClose={() => setDiaryPostModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          📝 Diaryに投稿
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            value={diaryPostContent}
            onChange={(e) => setDiaryPostContent(e.target.value)}
            placeholder="今日の学習や感想を書いてください..."
            variant="outlined"
            sx={{ mt: 1, mb: 2 }}
          />
          
          {/* 画像プレビュー */}
          {imagePreview && (
            <Box sx={{ mb: 2, position: 'relative' }}>
              <img
                src={imagePreview}
                alt="プレビュー"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
              <IconButton
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
          
          {/* 画像追加ボタン */}
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              id="diary-image-upload"
            />
            <label htmlFor="diary-image-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<ImageIcon />}
                disabled={isSubmitting}
              >
                画像を追加
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDiaryPostModalOpen(false)}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleDiaryPost}
            variant="contained"
            disabled={!diaryPostContent.trim() || isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {isSubmitting ? '投稿中...' : 'Diaryに投稿'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityPage; 