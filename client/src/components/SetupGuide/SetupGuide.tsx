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
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
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
  ]);

  // ローカルストレージからチェックリストの状態を読み込み
  useEffect(() => {
    const savedChecklist = localStorage.getItem('setupGuideChecklist');
    if (savedChecklist) {
      setChecklist(JSON.parse(savedChecklist));
    }
  }, []);

  // チェックリストの状態をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('setupGuideChecklist', JSON.stringify(checklist));
  }, [checklist]);

  const toggleItem = (itemId: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, completed: !item.completed }
          : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const isClass1Member = user?.role === 'Class1 Members';

  return (
    <Card sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              {t('setupGuide')}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
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
                        {item.isClass1Only && (
                          <Chip
                            label={t('class1Section')}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
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
                              <Chip
                                label={t('class1Section')}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
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
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SetupGuide; 