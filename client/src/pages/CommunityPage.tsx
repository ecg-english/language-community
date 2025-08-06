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
  InputBase,
  IconButton,
  Grid,
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
import { useTranslation } from 'react-i18next';

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
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const { t } = useTranslation();

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

  const handleMemberList = () => {
    navigate('/members');
  };

  const handleFeatures = () => {
    navigate('/features');
  };

  const getChannelTypeLabel = (channelType: string) => {
    switch (channelType) {
      case 'admin_only_instructors_view':
        return 'スタッフ専用通知';
      case 'admin_only_all_view':
        return 'お知らせ';
      case 'instructors_post_all_view':
        return '講師投稿';
      case 'all_post_all_view':
        return '一般投稿';
      case 'class1_post_class1_view':
        return 'Class1限定';
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

  console.log('CommunityPage render - categories length:', categories.length);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
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
                  color: '#1e40af',
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
                    backgroundColor: '#fafafb',
                  }}
                >
                  <InputBase
                    placeholder={t('community.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                      flex: 1,
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '& .MuiInputBase-input': {
                        color: '#1f2937',
                        '&::placeholder': {
                          color: '#9ca3af',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                  <IconButton
                    type="submit"
                    sx={{
                      p: { xs: 1, sm: 1.5 },
                      color: '#6b7280',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Box>
              </Paper>

              {/* メンバーリストボタン */}
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
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
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      border: '1px solid rgba(30, 64, 175, 0.3)',
                    },
                  }}
                  onClick={handleMemberList}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {t('community.memberList')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('community.memberListDescription')}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* このコミュニティでできることボタン */}
              <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
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
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      border: '1px solid rgba(30, 64, 175, 0.3)',
                    },
                  }}
                  onClick={handleFeatures}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
                    <InfoIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {t('community.whatYouCanDo')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('community.whatYouCanDoDescription')}
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
                          backgroundColor: '#ffffff',
                          minHeight: { xs: 56, sm: 64 },
                          '&:hover': {
                            backgroundColor: '#fafafb',
                          },
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
                            color: '#6b7280',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '1rem', sm: '1.125rem' },
                              color: '#1f2937',
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${channels[category.id]?.length || 0} ${t('community.channels')}`}
                            size="small"
                            sx={{
                              ml: 'auto',
                              mr: 2,
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280',
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
                                        color: '#1f2937',
                                        flex: 1,
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
                      {t('community.noCategories')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {t('community.waitAdmin')}
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