import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  WavingHand as WavingHandIcon,
  Campaign as CampaignIcon,
  ContactSupport as ContactSupportIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  isClass1Only?: boolean;
}

const SetupGuide: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  // チェックリストの初期化と翻訳の更新
  useEffect(() => {
    console.log('=== チェックリスト初期化開始 ===');
    const newChecklist: ChecklistItem[] = [
      {
        id: 'profile',
        title: t('profileCompletion'),
        description: t('profileCompletionDesc'),
        completed: false,
      },
      {
        id: 'introduce',
        title: t('introduceYourself'),
        description: t('introduceYourselfDesc'),
        completed: false,
      },
      {
        id: 'announcements',
        title: t('checkAnnouncements'),
        description: t('checkAnnouncementsDesc'),
        completed: false,
      },
      {
        id: 'contact',
        title: t('contactInstructor'),
        description: t('contactInstructorDesc'),
        completed: false,
        isClass1Only: true,
      },
    ];

    console.log('新しいチェックリスト:', newChecklist);
    console.log('announcements項目:', newChecklist.find(item => item.id === 'announcements'));

    // ローカルストレージからチェックリストの状態を読み込み
    if (user?.id) {
      const savedChecklist = localStorage.getItem(`setupGuideChecklist_${user.id}`);
      console.log('保存されたチェックリスト:', savedChecklist);
      if (savedChecklist) {
        const savedItems = JSON.parse(savedChecklist);
        console.log('パースされた保存項目:', savedItems);
        // 保存された完了状態を新しいチェックリストに適用
        const updatedChecklist = newChecklist.map(item => {
          const savedItem = savedItems.find((saved: any) => saved.id === item.id);
          const result = savedItem ? { ...item, completed: savedItem.completed } : item;
          if (item.id === 'announcements') {
            console.log('announcements項目更新:', result);
          }
          return result;
        });
        console.log('更新されたチェックリスト:', updatedChecklist);
        setChecklist(updatedChecklist);
      } else {
        console.log('保存されたチェックリストなし、新規作成');
        setChecklist(newChecklist);
      }
    } else {
      console.log('ユーザーIDなし、新規作成');
      setChecklist(newChecklist);
    }
    console.log('=== チェックリスト初期化完了 ===');
  }, [t, user?.id]); // tが変更されたときに再実行

  // 非表示状態をローカルストレージから読み込み
  useEffect(() => {
    if (user?.id) {
      const hidden = localStorage.getItem(`setupGuideHidden_${user.id}`);
      if (hidden === 'true') {
        setIsHidden(true);
      }
    }
  }, [user?.id]);

  // プロフィール完了状態をチェック
  const checkProfileCompletion = async () => {
    if (!user?.id) return;
    
    try {
      const response = await axios.get(`/api/auth/users/${user.id}`);
      const profileData = response.data.user;
      
      // 一言メッセージと自己紹介が記入されているかチェック
      const hasMessage = profileData.message && profileData.message.trim() !== '';
      const hasBio = profileData.bio && profileData.bio.trim() !== '';
      
      if (hasMessage && hasBio) {
        setChecklist(prev => 
          prev.map(item => 
            item.id === 'profile' 
              ? { ...item, completed: true }
              : item
          )
        );
      }
    } catch (error) {
      console.error('プロフィール完了チェックエラー:', error);
    }
  };

  // 自己紹介チャンネルでの投稿完了チェック
  const checkIntroduceCompletion = async () => {
    if (!user?.id) return;
    
    try {
      console.log('自己紹介完了チェック開始:', { userId: user.id });
      
      // 自己紹介チャンネル（ID: 13）での投稿をチェック
      const response = await axios.get('/api/posts/channels/13/posts');
      const posts = response.data.posts || [];
      
      console.log('自己紹介チャンネルの投稿数:', posts.length);
      console.log('投稿一覧:', posts.map((p: any) => ({ id: p.id, user_id: p.user_id, content: p.content.substring(0, 50) })));
      
      // ユーザーが投稿しているかチェック
      const hasUserPost = posts.some((post: any) => post.user_id === user.id);
      
      console.log('ユーザーの投稿有無:', hasUserPost);
      
      if (hasUserPost) {
        console.log('自己紹介完了としてマーク');
        setChecklist(prev => 
          prev.map(item => 
            item.id === 'introduce' 
              ? { ...item, completed: true }
              : item
          )
        );
      }
    } catch (error) {
      console.error('自己紹介完了チェックエラー:', error);
    }
  };

  // プロフィール完了状態を定期的にチェック
  useEffect(() => {
    if (user?.id) {
      checkProfileCompletion();
      checkIntroduceCompletion();
      // 10秒ごとにチェック（より頻繁に）
      const interval = setInterval(() => {
        console.log('定期チェック実行');
        checkProfileCompletion();
        checkIntroduceCompletion();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // チェックリストの状態をローカルストレージに保存
  useEffect(() => {
    console.log('チェックリスト状態変更:', checklist);
    if (user?.id) {
      localStorage.setItem(`setupGuideChecklist_${user.id}`, JSON.stringify(checklist));
      console.log('ローカルストレージに保存完了:', `setupGuideChecklist_${user.id}`);
    }
  }, [checklist, user?.id]);

  const toggleItem = (itemId: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const handleHideSetupGuide = () => {
    setIsHidden(true);
    if (user?.id) {
      localStorage.setItem(`setupGuideHidden_${user.id}`, 'true');
    }
  };

  const handleProfileNavigation = (e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を停止
    navigate(`/profile/${user?.id}`);
  };

  const handleIntroduceNavigation = (e: React.MouseEvent) => {
    e.stopPropagation(); // イベントの伝播を停止
    navigate('/channel/13'); // 自己紹介チャンネル（正しいID）
  };

  const handleContactInstructorNavigation = () => {
    // InstagramやDiscordへの案内ページまたは外部リンク
    // とりあえずお知らせチャンネルに遷移
    navigate('/channel/11');
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = progress === 100;

  const isClass1Member = user?.role === 'Class1 Members';

  // 非表示の場合は何も表示しない
  if (isHidden) {
    return null;
  }

  return (
    <Card sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('setupGuide')}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{ position: 'absolute', right: 0 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('setupGuideSubtitle')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ flex: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                {completedCount}/{totalCount}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {progress === 100 ? t('completed') : t('pending')}
            </Typography>
          </Box>

          <List sx={{ p: 0 }}>
            {checklist.map((item, index) => {
              // Class1限定項目で、Class1メンバーでない場合はスキップ
              if (item.isClass1Only && !isClass1Member) {
                return null;
              }

              // お知らせ項目のデバッグ
              if (item.id === 'announcements') {
                console.log('お知らせ項目:', item.completed ? '完了済み' : '未完了');
              }

              return (
                <ListItem
                  key={item.id}
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 1,
                    mb: 1,
                    cursor: ['profile', 'introduce', 'announcements'].includes(item.id) ? 'default' : 'pointer',
                    '&:hover': {
                      backgroundColor: ['profile', 'introduce', 'announcements'].includes(item.id) ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                  onClick={() => {
                    // プロフィール、自己紹介、お知らせの項目はボタンで遷移するためクリック不可
                    // contact（講師連絡）は手動チェックのみ
                    if (['profile', 'introduce', 'announcements'].includes(item.id)) {
                      return;
                    }
                    toggleItem(item.id);
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.completed ? (
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: 'text.secondary' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        justifyContent: 'space-between',
                        flexDirection: { xs: 'row', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'center' },
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: item.completed ? 500 : 400,
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'text.secondary' : 'text.primary',
                            flex: { xs: '1 1 auto', sm: '1 1 auto' },
                            minWidth: 0,
                          }}
                        >
                          {item.title}
                        </Typography>
                        {item.id === 'profile' && !item.completed && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PersonIcon />}
                            onClick={handleProfileNavigation}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              py: { xs: 0.25, sm: 0.5 },
                              px: { xs: 1, sm: 1.5 },
                              minWidth: { xs: 'auto', sm: 'auto' },
                              flexShrink: 0,
                              '& .MuiButton-startIcon': {
                                marginRight: { xs: 0.5, sm: 0.5 },
                              },
                            }}
                          >
                            {t('profile')}
                          </Button>
                        )}
                        {item.id === 'introduce' && !item.completed && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<WavingHandIcon />}
                            onClick={handleIntroduceNavigation}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              py: { xs: 0.25, sm: 0.5 },
                              px: { xs: 1, sm: 1.5 },
                              minWidth: { xs: 'auto', sm: 'auto' },
                              flexShrink: 0,
                              '& .MuiButton-startIcon': {
                                marginRight: { xs: 0.5, sm: 0.5 },
                              },
                            }}
                          >
                            {t('setupGuideIntroduce')}
                          </Button>
                        )}
                        {item.id === 'announcements' && !item.completed && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CampaignIcon />}
                            onClick={() => {
                              console.log('お知らせボタンクリック！');
                              setChecklist(prev => 
                                prev.map(item => 
                                  item.id === 'announcements' 
                                    ? { ...item, completed: true }
                                    : item
                                )
                              );
                              navigate('/channel/11');
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 500,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              py: { xs: 0.25, sm: 0.5 },
                              px: { xs: 1, sm: 1.5 },
                              minWidth: { xs: 'auto', sm: 'auto' },
                              flexShrink: 0,
                              '& .MuiButton-startIcon': {
                                marginRight: { xs: 0.5, sm: 0.5 },
                              },
                            }}
                          >
                            {t('setupGuideAnnouncements')}
                          </Button>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          textDecoration: item.completed ? 'line-through' : 'none',
                        }}
                      >
                        {item.description}
                      </Typography>
                    }
                  />
                </ListItem>
              );
            })}
          </List>

          {/* Class1限定セクションの折りたたみ可能なセクション */}
          {!isClass1Member && (
            <Accordion sx={{ mt: 2, boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="body2" color="text.secondary">
                  {t('class1Section')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ p: 0 }}>
                  {checklist
                    .filter(item => item.isClass1Only)
                    .map((item) => (
                      <ListItem
                        key={item.id}
                        sx={{
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 1,
                          mb: 1,
                          cursor: ['profile', 'introduce', 'announcements'].includes(item.id) ? 'default' : 'pointer',
                          opacity: 0.6,
                          '&:hover': {
                            backgroundColor: ['profile', 'introduce', 'announcements'].includes(item.id) ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                        onClick={() => {
                          // プロフィール、自己紹介、お知らせの項目はボタンで遷移するためクリック不可
                          // contact（講師連絡）は手動チェックのみ
                          if (['profile', 'introduce', 'announcements'].includes(item.id)) {
                            return;
                          }
                          toggleItem(item.id);
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {item.completed ? (
                            <CheckCircleIcon sx={{ color: 'success.main' }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ color: 'text.secondary' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ 
                              display: 'flex', 
                              gap: 1, 
                              justifyContent: 'space-between',
                              flexDirection: { xs: 'row', sm: 'row' },
                              alignItems: { xs: 'center', sm: 'center' },
                              flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: item.completed ? 500 : 400,
                                  textDecoration: item.completed ? 'line-through' : 'none',
                                  color: item.completed ? 'text.secondary' : 'text.primary',
                                  flex: { xs: '1 1 auto', sm: '1 1 auto' },
                                  minWidth: 0,
                                }}
                              >
                                {item.title}
                              </Typography>
                              {item.id === 'profile' && !item.completed && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<PersonIcon />}
                                  onClick={handleProfileNavigation}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    py: { xs: 0.25, sm: 0.5 },
                                    px: { xs: 1, sm: 1.5 },
                                    minWidth: { xs: 'auto', sm: 'auto' },
                                    flexShrink: 0,
                                    '& .MuiButton-startIcon': {
                                      marginRight: { xs: 0.5, sm: 0.5 },
                                    },
                                  }}
                                >
                                  {t('profile')}
                                </Button>
                              )}
                              {item.id === 'introduce' && !item.completed && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<WavingHandIcon />}
                                  onClick={handleIntroduceNavigation}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    py: { xs: 0.25, sm: 0.5 },
                                    px: { xs: 1, sm: 1.5 },
                                    minWidth: { xs: 'auto', sm: 'auto' },
                                    flexShrink: 0,
                                    '& .MuiButton-startIcon': {
                                      marginRight: { xs: 0.5, sm: 0.5 },
                                    },
                                  }}
                                >
                                  {t('setupGuideIntroduce')}
                                </Button>
                              )}
                              {item.id === 'announcements' && !item.completed && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CampaignIcon />}
                                  onClick={() => {
                                    console.log('お知らせボタンクリック！');
                                    setChecklist(prev => 
                                      prev.map(item => 
                                        item.id === 'announcements' 
                                          ? { ...item, completed: true }
                                          : item
                                      )
                                    );
                                    navigate('/channel/11');
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    py: { xs: 0.25, sm: 0.5 },
                                    px: { xs: 1, sm: 1.5 },
                                    minWidth: { xs: 'auto', sm: 'auto' },
                                    flexShrink: 0,
                                    '& .MuiButton-startIcon': {
                                      marginRight: { xs: 0.5, sm: 0.5 },
                                    },
                                  }}
                                >
                                  {t('setupGuideAnnouncements')}
                                </Button>
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                textDecoration: item.completed ? 'line-through' : 'none',
                              }}
                            >
                              {item.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 全て完了した時に「非表示にする」ボタンを表示 */}
          {allCompleted && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleHideSetupGuide}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {t('hideSetupGuide')}
              </Button>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SetupGuide; 