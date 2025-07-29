import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Fade,
} from '@mui/material';
import {
  RecordVoiceOver as VoiceIcon,
  School as SchoolIcon,
  VideoLibrary as VideoIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const FeaturesPage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      id: 1,
      title: '週1発音添削',
      icon: <VoiceIcon sx={{ fontSize: 48, color: '#4CAF50' }} />,
      description: '毎週送られてくる課題に対して音声を提出！週1回の頻度で全体へ向けた発音添削フィードバックが返信されます。',
      tagline: '週1発音添削',
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    },
    {
      id: 2,
      title: 'みんなの勉強記録',
      icon: <TrendingIcon sx={{ fontSize: 48, color: '#FF9800' }} />,
      description: 'みんなで勉強記録をシェアして、お互いの成長をモチベーションに変えていきましょう。',
      tagline: 'モチベーションを高め合える場所',
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
    },
    {
      id: 3,
      title: '発音ビデオ講座',
      icon: <VideoIcon sx={{ fontSize: 48, color: '#2196F3' }} />,
      description: '添削してほしい音声はチャットグループに送信。週1回の頻度で音声添削フィードバックが全体へ向けて返信されます。',
      tagline: '発音講座の一部を無料公開！',
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    },
    {
      id: 4,
      title: 'Class1専用チャンネル',
      icon: <TrophyIcon sx={{ fontSize: 48, color: '#9C27B0' }} />,
      description: 'Class1メンバー専用の特別なチャンネルで、より深い学習と交流を楽しめます。',
      tagline: 'Class1メンバー限定',
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
    },
    {
      id: 5,
      title: '講師との直接交流',
      icon: <SchoolIcon sx={{ fontSize: 48, color: '#E91E63' }} />,
      description: '経験豊富な講師と直接交流し、個別のアドバイスを受けることができます。',
      tagline: 'プロの指導を受けられる',
      color: '#E91E63',
      gradient: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
    },
    {
      id: 6,
      title: 'コミュニティチャット',
      icon: <ChatIcon sx={{ fontSize: 48, color: '#607D8B' }} />,
      description: 'リアルタイムで他のメンバーと交流し、質問や情報共有を行えます。',
      tagline: 'リアルタイム交流',
      color: '#607D8B',
      gradient: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* ヘッダー */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Fade in timeout={800}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            このコミュニティでできること
          </Typography>
        </Fade>
        
        <Fade in timeout={1000}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              mb: 4,
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            言語学習コミュニティの主なコンテンツをご紹介します
          </Typography>
        </Fade>

        {/* ユーザー情報 */}
        <Fade in timeout={1200}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              ようこそ、
            </Typography>
            <Chip
              label={user?.username}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                px: 2,
                py: 1,
              }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ ml: 1, display: 'inline' }}>
              さん！
            </Typography>
          </Box>
        </Fade>
      </Box>

      {/* 機能カード */}
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} lg={4} key={feature.id}>
            <Fade in timeout={1400 + index * 200}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${feature.color}40`,
                  },
                }}
              >
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* アイコン */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    {feature.icon}
                  </Box>

                  {/* タイトル */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      textAlign: 'center',
                      color: feature.color,
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
                      flex: 1,
                    }}
                  >
                    {feature.description}
                  </Typography>

                  {/* タグライン */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip
                      label={feature.tagline}
                      sx={{
                        background: feature.gradient,
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* 追加情報 */}
      <Fade in timeout={2000}>
        <Paper
          elevation={0}
          sx={{
            mt: 8,
            p: 4,
            borderRadius: 3,
            border: '1px solid rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <LanguageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              言語学習の旅を一緒に
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              このコミュニティでは、一人ひとりの学習スタイルを尊重しながら、
              みんなで一緒に成長していく環境を提供しています。
              あなたの言語学習の目標を、私たちと一緒に達成しましょう。
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default FeaturesPage; 