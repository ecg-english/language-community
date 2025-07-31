import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  RecordVoiceOver as RecordVoiceOverIcon,
  TrendingUp as TrendingUpIcon,
  PlayCircle as PlayCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const FeaturesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const features = [
    {
      id: 1,
      title: t('pronunciationCorrection'),
      icon: <RecordVoiceOverIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
      description: t('pronunciationDescription'),
      tagline: t('pronunciationCorrection'),
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    },
    {
      id: 2,
      title: t('studyLog'),
      icon: <TrendingUpIcon sx={{ fontSize: 48, color: '#FF9800' }} />,
      description: t('studyLogDescription'),
      tagline: t('motivationPlace'),
      gradient: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
    },
    {
      id: 3,
      title: t('pronunciationVideo'),
      icon: <PlayCircleIcon sx={{ fontSize: 48, color: '#2196F3' }} />,
      description: t('pronunciationVideoDescription'),
      tagline: t('freePronunciationCourse'),
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2rem', sm: '3rem' },
          }}
        >
          {t('featuresTitle')}
        </Typography>
        
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            mb: 4,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          {t('featuresSubtitle')}
        </Typography>

        {/* ユーザー情報 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            {t('welcomeMessage', { username: user?.username })}
          </Typography>
        </Box>
      </Box>

      {/* 機能カード */}
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={feature.id}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                {/* アイコン */}
                <Box sx={{ mb: 3 }}>
                  {feature.icon}
                </Box>

                {/* タイトル */}
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  }}
                >
                  {feature.title}
                </Typography>

                {/* 説明 */}
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    lineHeight: 1.6,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {feature.description}
                </Typography>

                {/* タグライン */}
                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    sx={{
                      background: feature.gradient,
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      fontSize: '0.9rem',
                    }}
                  >
                    {feature.tagline}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default FeaturesPage; 