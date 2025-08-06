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
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

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
  const [expanded, setExpanded] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isHidden, setIsHidden] = useState(false);

  // チェックリストの初期化と翻訳の更新
  useEffect(() => {
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

    // ローカルストレージからチェックリストの状態を読み込み
    if (user?.id) {
      const savedChecklist = localStorage.getItem(`setupGuideChecklist_${user.id}`);
      if (savedChecklist) {
        const savedItems = JSON.parse(savedChecklist);
        // 保存された完了状態を新しいチェックリストに適用
        const updatedChecklist = newChecklist.map(item => {
          const savedItem = savedItems.find((saved: any) => saved.id === item.id);
          return savedItem ? { ...item, completed: savedItem.completed } : item;
        });
        setChecklist(updatedChecklist);
      } else {
        setChecklist(newChecklist);
      }
    } else {
      setChecklist(newChecklist);
    }
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

  // チェックリストの状態をローカルストレージに保存
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`setupGuideChecklist_${user.id}`, JSON.stringify(checklist));
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

              return (
                <ListItem
                  key={item.id}
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                  onClick={() => toggleItem(item.id)}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: item.completed ? 500 : 400,
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {item.title}
                        </Typography>
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
                          cursor: 'pointer',
                          opacity: 0.6,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                        onClick={() => toggleItem(item.id)}
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: item.completed ? 500 : 400,
                                  textDecoration: item.completed ? 'line-through' : 'none',
                                  color: item.completed ? 'text.secondary' : 'text.primary',
                                }}
                              >
                                {item.title}
                              </Typography>
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