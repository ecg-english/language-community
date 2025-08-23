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
    '会話スキルを伸ばしたい',
    '文法の正確さを高めたい',
    '語彙を増やしたい',
    '発音を改善したい',
    'リスニングを鍛えたい',
    '試験対策(英検/TOEICなど)',
    '文化についてもっと学びたい',
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
        setSuccess('アンケートを送信しました。ありがとうございます！');
        setSurveyData(prev => ({ ...prev, completed: true, submitted_at: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('アンケート送信エラー:', error);
      setError('アンケートの送信に失敗しました。もう一度お試しください。');
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
              {formatMonthDisplay(currentMonth)}のアンケートは実施済みです
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              ご協力いただき、ありがとうございました。
            </Typography>
            {surveyData.submitted_at && (
              <Typography variant="caption" color="text.secondary">
                送信日時: {new Date(surveyData.submitted_at).toLocaleString('ja-JP')}
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
          {formatMonthDisplay(currentMonth)} | フィードバック
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
          {/* 満足度評価 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              現状の講師に対する満足度*
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
                  },
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {surveyData.satisfaction_rating}/5
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              1: 非常に不満 ~ 5: 非常に満足
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 推奨意向 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              このサービスを友人に勧めたいと思いますか?*
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
                sx={{ flex: 1 }}
              />
              <Box
                sx={{
                  minWidth: 40,
                  height: 32,
                  backgroundColor: 'success.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                {surveyData.recommendation_score}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              0 (全く勧めない) ~ 10 (強く勧めたい)
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* フィードバック */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              講師に対するフィードバック
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              例:説明がわかりやすかった/もっと会話量を増やしてほしい
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={surveyData.instructor_feedback}
              onChange={(e) => setSurveyData(prev => ({ ...prev, instructor_feedback: e.target.value }))}
              placeholder="講師についてのご意見をお聞かせください"
              variant="outlined"
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              レッスン内容に関するフィードバック
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              例:発音練習を追加したい/宿題の量を調整してほしい
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={surveyData.lesson_feedback}
              onChange={(e) => setSurveyData(prev => ({ ...prev, lesson_feedback: e.target.value }))}
              placeholder="レッスン内容についてのご意見をお聞かせください"
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 来月学びたいこと */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              来月学びたいこと
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
              その他 (自由記述)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              例:海外旅行で困らない接客英語を練習したい
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={surveyData.other_comments}
              onChange={(e) => setSurveyData(prev => ({ ...prev, other_comments: e.target.value }))}
              placeholder="その他のご意見やご要望があればお聞かせください"
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
              disabled={submitting || surveyData.satisfaction_rating === 0}
              sx={{ 
                minWidth: 200,
                py: 1.5,
                px: 4
              }}
            >
              {submitting ? '送信中...' : 'アンケートを送信'}
            </Button>
            {surveyData.satisfaction_rating === 0 && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                * 満足度評価は必須項目です
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SurveyPage; 