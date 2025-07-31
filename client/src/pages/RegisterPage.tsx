import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Card,
  CardContent,
  Fade,
  Avatar,
  Divider,
} from '@mui/material';
import { Language, PersonAddOutlined, EmailOutlined, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password);
      navigate('/community');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 1, sm: 2 },
      }}
    >
      <Container component="main" maxWidth="sm">
        <Fade in timeout={800}>
          <Card 
            elevation={0}
            sx={{ 
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 3,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: { xs: 3, sm: 4 },
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 60, sm: 72 },
                    height: { xs: 60, sm: 72 },
                    backgroundColor: '#1e40af',
                    mb: { xs: 2, sm: 3 },
                    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Language sx={{ fontSize: { xs: 32, sm: 40 } }} />
                </Avatar>
                
                <Typography 
                  component="h1" 
                  variant="h4" 
                  sx={{
                    fontWeight: 700,
                    color: '#1e40af',
                    mb: 1,
                    textAlign: 'center',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' },
                  }}
                >
                  言語学習コミュニティ
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  textAlign="center"
                  sx={{ 
                    maxWidth: 400,
                    lineHeight: 1.6,
                    fontWeight: 400,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  英語を学ぶ日本人と日本語を学ぶ外国人のための
                  <br />
                  プレミアムコミュニティ
                </Typography>
              </Box>

              <Divider sx={{ mb: { xs: 3, sm: 4 }, borderColor: 'rgba(0, 0, 0, 0.08)' }} />

              {error && (
                <Fade in>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.2)',
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="ユーザー名"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <PersonAddOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    },
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="メールアドレス"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <EmailOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    },
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="パスワード"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    },
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="パスワード確認"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <LockOutlined sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                      },
                    },
                  }}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    py: { xs: 1.5, sm: 1.8 },
                    mb: 3,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                    backgroundColor: '#1e40af',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      backgroundColor: '#1e3a8a',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    },
                  }}
                >
                  {isLoading ? 'アカウント作成中...' : 'アカウント作成'}
                </Button>
                
                <Box textAlign="center">
                  <Link
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    sx={{ 
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    既にアカウントをお持ちの方はこちら
                  </Link>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        <Box sx={{ mt: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            © 2025 英会話ジム ECG. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage; 