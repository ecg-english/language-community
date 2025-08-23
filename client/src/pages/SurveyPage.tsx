import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Slider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Rating,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  Star as StarIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface SurveyData {
  member_number: string;
  satisfaction_rating: number;
  recommendation_score: number;
  instructor_feedback: string;
  lesson_feedback: string;
  next_month_goals: string[];
  other_comments: string;
  completed: boolean;
  submitted_at?: string;
}

const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  const [surveyData, setSurveyData] = useState<SurveyData>({
    member_number: '',
    satisfaction_rating: 0,
    recommendation_score: 5,
    instructor_feedback: '',
    lesson_feedback: '',
    next_month_goals: [],
    other_comments: '',
    completed: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');

  // 権限チェック
  const hasPermission = user?.role === 'Class1 Members';

  // 来月学びたいことの選択肢
  const nextMonthGoals = [
    t('conversationSkills'),
    t('grammarAccuracy'),
    t('vocabulary'),
    t('pronunciation'),
    t('listening'),
    t('examPreparation'),
    t('culture'),
  ];

  useEffect(() => {
    if (!hasPermission) {
      navigate('/');
      return;
    }

    // 現在の年月を設定
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(currentMonthStr);

    fetchSurveyData();
  }, [hasPermission, navigate]);

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/survey/current-month`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        if (response.data.survey) {
          setSurveyData(response.data.survey);
        }
      }
    } catch (error) {
      console.error('アンケートデータ取得エラー:', error);
      // エラーが404の場合は新しい月なので空のデータを設定
      setSurveyData({
        member_number: '',
        satisfaction_rating: 0,
        recommendation_score: 5,
        instructor_feedback: '',
        lesson_feedback: '',
        next_month_goals: [],
        other_comments: '',
        completed: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSatisfactionChange = (event: React.SyntheticEvent, value: number | null) => {
    setSurveyData(prev => ({ ...prev, satisfaction_rating: value || 0 }));
  };

  const handleRecommendationChange = (event: Event, newValue: number | number[]) => {
    setSurveyData(prev => ({ ...prev, recommendation_score: newValue as number }));
  };

  const handleGoalChange = (goal: string) => {
    setSurveyData(prev => ({
      ...prev,
      next_month_goals: prev.next_month_goals.includes(goal)
        ? prev.next_month_goals.filter(g => g !== goal)
        : [...prev.next_month_goals, goal]
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/survey/submit`,
        {
          ...surveyData,
          month: currentMonth,
          completed: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess(t('surveySubmitted'));
        setSurveyData(prev => ({ ...prev, completed: true, submitted_at: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('アンケート送信エラー:', error);
      setError(t('surveyError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${month}月`;
  };

  if (!hasPermission) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (surveyData.completed) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              {t('surveyCompleted', { month: formatMonthDisplay(currentMonth) })}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('surveyCompletedDescription')}
            </Typography>
            {surveyData.submitted_at && (
              <Typography variant="caption" color="text.secondary">
                {t('submissionTime')}: {new Date(surveyData.submitted_at).toLocaleString('ja-JP')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          {formatMonthDisplay(currentMonth)} | {t('feedback')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          講師やレッスンについてのご意見をお聞かせください
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {/* 会員番号入力 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('memberNumber')}*
            </Typography>
            <TextField
              fullWidth
              value={surveyData.member_number}
              onChange={(e) => setSurveyData(prev => ({ ...prev, member_number: e.target.value }))}
              placeholder={t('memberNumberPlaceholder')}
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {t('memberNumberHelp')}
            </Typography>
          </Box>

          {/* 満足度評価 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('satisfactionRating')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Rating
                name="satisfaction"
                value={surveyData.satisfaction_rating}
                onChange={handleSatisfactionChange}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: 'warning.main',
                    animation: 'glow 2s ease-in-out infinite alternate, rotate 0.6s ease-in-out',
                    '@keyframes glow': {
                      '0%': {
                        filter: 'drop-shadow(0 0 5px #ff9800)',
                      },
                      '100%': {
                        filter: 'drop-shadow(0 0 20px #ff9800) drop-shadow(0 0 30px #ff9800)',
                      },
                    },
                    '@keyframes rotate': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  },
                  '& .MuiRating-iconHover': {
                    transform: 'scale(1.2)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {surveyData.satisfaction_rating}/5
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('satisfactionDescription')}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 推奨意向 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('recommendationQuestion')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Slider
                value={surveyData.recommendation_score}
                onChange={handleRecommendationChange}
                min={0}
                max={10}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ 
                  flex: 1,
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #f44336 0%, #ff9800 20%, #ffeb3b 40%, #8bc34a 60%, #4caf50 80%, #2e7d32 100%)',
                  height: 8,
                  borderRadius: 4,
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                },
                '& .MuiSlider-thumb': {
                  width: 24,
                  height: 24,
                  backgroundColor: '#fff',
                  border: '3px solid #1976d2',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 12px rgba(0,0,0,0.4)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                },
                '& .MuiSlider-mark': {
                  backgroundColor: '#bfbfbf',
                  height: 8,
                  width: 1,
                  '&.MuiSlider-markActive': {
                    backgroundColor: 'currentColor',
                  },
                },
              }}
              />
              <Box
                sx={{
                  minWidth: 50,
                  height: 40,
                  backgroundColor: (() => {
                    const score = surveyData.recommendation_score;
                    if (score <= 1) return '#f44336'; // 赤
                    if (score <= 3) return '#ff9800'; // オレンジ
                    if (score <= 5) return '#ffeb3b'; // 黄色
                    if (score <= 7) return '#8bc34a'; // 黄緑
                    if (score <= 9) return '#4caf50'; // 緑
                    return '#2e7d32'; // 深緑
                  })(),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                  },
                }}
              >
                {surveyData.recommendation_score}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('recommendationDescription')}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* フィードバック */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('instructorFeedback')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('instructorFeedbackExample')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={surveyData.instructor_feedback}
              onChange={(e) => setSurveyData(prev => ({ ...prev, instructor_feedback: e.target.value }))}
              placeholder={t('instructorFeedbackPlaceholder')}
              variant="outlined"
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('lessonFeedback')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('lessonFeedbackExample')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={surveyData.lesson_feedback}
              onChange={(e) => setSurveyData(prev => ({ ...prev, lesson_feedback: e.target.value }))}
              placeholder={t('lessonFeedbackPlaceholder')}
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 来月学びたいこと */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('nextMonthGoals')}
            </Typography>
            <FormGroup>
              {nextMonthGoals.map((goal) => (
                <FormControlLabel
                  key={goal}
                  control={
                    <Checkbox
                      checked={surveyData.next_month_goals.includes(goal)}
                      onChange={() => handleGoalChange(goal)}
                    />
                  }
                  label={goal}
                  sx={{ mb: 1 }}
                />
              ))}
            </FormGroup>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* その他 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('otherComments')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('otherCommentsExample')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={surveyData.other_comments}
              onChange={(e) => setSurveyData(prev => ({ ...prev, other_comments: e.target.value }))}
              placeholder={t('otherCommentsPlaceholder')}
              variant="outlined"
            />
          </Box>

          {/* 送信ボタン */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handleSubmit}
              disabled={submitting || surveyData.satisfaction_rating === 0 || !surveyData.member_number}
              sx={{ 
                minWidth: 200,
                py: 1.5,
                px: 4
              }}
            >
              {submitting ? t('submitting') : t('submitSurvey')}
            </Button>
            {(surveyData.satisfaction_rating === 0 || !surveyData.member_number) && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {t('requiredFields')}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SurveyPage; 