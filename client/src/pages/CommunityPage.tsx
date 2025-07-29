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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Badge,
  Paper,
  Fade,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Tag as TagIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Language,
  Search as SearchIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useCommunity } from '../contexts/CommunityContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const {
    categories,
    channels,
    loadCategories,
    loadChannels,
    toggleCategory,
  } = useCommunity();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      console.log('CommunityPage: loadCategories called (first time)');
      loadCategories();
      hasLoaded.current = true;
    }
  }, []); // 空の依存配列で初回のみ実行

  const handleCategoryToggle = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && !category.is_collapsed) {
      // カテゴリを展開する時にチャンネルを読み込む
      loadChannels(categoryId);
    }
    toggleCategory(categoryId);
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

  const handleMemberList = () => {
    navigate('/members');
  };

  const handleFeatures = () => {
    navigate('/features');
  };

  const getChannelTypeLabel = (channelType: string) => {
    switch (channelType) {
      case 'admin_only_instructors_view':
        return '管理者専用';
      case 'admin_only_all_view':
        return 'お知らせ';
      case 'instructors_post_all_view':
        return '講師投稿';
      case 'all_post_all_view':
        return '一般投稿';
      case 'class1_post_class1_view':
        return 'Class1専用';
      default:
        return '不明';
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
        return 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)';
      case 'ECG講師':
      case 'JCG講師':
        return 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
      case 'Class1 Members':
        return 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)';
      case 'ECGメンバー':
      case 'JCGメンバー':
        return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
      case 'Trial参加者':
        return 'linear-gradient(135deg, #757575 0%, #616161 100%)';
      default:
        return 'linear-gradient(135deg, #757575 0%, #616161 100%)';
    }
  };

  console.log('CommunityPage render - categories length:', categories.length);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fafafb 0%, #f3f4f6 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Fade in timeout={800}>
          <Box>
            {/* ヘッダーセクション */}
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                言語学習コミュニティ
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
                ようこそ、
                <Chip
                  label={user?.username}
                  sx={{
                    mx: 1,
                    background: getRoleGradient(user?.role || ''),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                />
                さん！
              </Typography>
              
              {/* 検索窓 */}
              <Paper 
                component="form"
                onSubmit={handleSearch}
                elevation={0}
                sx={{ 
                  p: 2, 
                  mb: 4,
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: 3,
                  maxWidth: 600,
                  mx: 'auto',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                }}
              >
                <TextField
                  fullWidth
                  placeholder="投稿内容やユーザー名を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused fieldset': {
                        border: '2px solid',
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />
              </Paper>

              {/* メンバーリストボタン */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 3,
                    maxWidth: 300,
                    mx: 'auto',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    },
                  }}
                  onClick={handleMemberList}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      メンバーリスト
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      コミュニティのメンバー一覧を確認
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* このコミュニティでできることボタン */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 3,
                    maxWidth: 300,
                    mx: 'auto',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    },
                  }}
                  onClick={handleFeatures}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <InfoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      このコミュニティでできること
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      コミュニティの機能を詳しく紹介
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* カテゴリセクション */}
            <Stack spacing={3}>
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
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <Accordion
                      expanded={!category.is_collapsed}
                      onChange={() => handleCategoryToggle(category.id)}
                      elevation={0}
                      sx={{
                        '&:before': { display: 'none' },
                        borderRadius: 0,
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'text.primary' }} />}
                        sx={{ 
                          backgroundColor: '#ffffff',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                          '&:hover': { 
                            backgroundColor: '#f9fafb',
                          },
                          '& .MuiAccordionSummary-content': {
                            alignItems: 'center',
                            py: 2,
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                          <Avatar
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              width: 36,
                              height: 36,
                            }}
                          >
                            <TagIcon sx={{ color: 'white', fontSize: 20 }} />
                          </Avatar>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 700, 
                              flexGrow: 1,
                              color: 'text.primary',
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${channels[category.id]?.length || 0} チャンネル`}
                            size="small"
                            sx={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Stack>
                      </AccordionSummary>
                      
                      <AccordionDetails sx={{ p: 0 }}>
                        {channels[category.id]?.length > 0 ? (
                          <List disablePadding>
                            {channels[category.id].map((channel) => (
                              <ListItem key={channel.id} disablePadding>
                                <ListItemButton
                                  onClick={() => handleChannelClick(channel.id)}
                                  sx={{
                                    py: 3,
                                    px: 3,
                                    '&:hover': { 
                                      bgcolor: 'rgba(102, 126, 234, 0.04)',
                                      transform: 'translateX(8px)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  <ListItemIcon>
                                    <ChatIcon 
                                      sx={{ 
                                        color: 'primary.main',
                                        fontSize: 28,
                                      }} 
                                    />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>
                                          {channel.name}
                                        </Typography>
                                        <Chip
                                          label={getChannelTypeLabel(channel.channel_type)}
                                          size="small"
                                          color={getChannelTypeColor(channel.channel_type) as any}
                                          variant="outlined"
                                          sx={{ fontWeight: 500 }}
                                        />
                                      </Stack>
                                    }
                                    secondary={
                                      <Stack direction="row" spacing={3} alignItems="center" sx={{ mt: 1 }}>
                                        {channel.description && (
                                          <Typography variant="body2" color="text.secondary">
                                            {channel.description}
                                          </Typography>
                                        )}
                                        <Badge
                                          badgeContent={channel.post_count}
                                          color="primary"
                                          showZero
                                          sx={{
                                            '& .MuiBadge-badge': {
                                              fontWeight: 600,
                                            },
                                          }}
                                        >
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            <PeopleIcon fontSize="small" color="action" />
                                            <Typography variant="caption" color="text.secondary">
                                              投稿
                                            </Typography>
                                          </Stack>
                                        </Badge>
                                      </Stack>
                                    }
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ p: 6, textAlign: 'center' }}>
                            <ChatIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              チャンネルがありません
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              このカテゴリにはまだチャンネルが作成されていません
                            </Typography>
                          </Box>
                        )}
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
                      カテゴリがまだありません
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      管理者がカテゴリとチャンネルを作成するまでお待ちください
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default CommunityPage; 