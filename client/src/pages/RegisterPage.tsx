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
        background: 'linear-gradient(180deg, #fafafb 0%, #f3f4f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Fade in timeout={800}>
          <Card 
            elevation={0}
            sx={{ 
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: 3,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CardContent sx={{ p: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 4,
                }}
              >
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    mb: 3,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <Language sx={{ fontSize: 40 }} />
                </Avatar>
                
                <Typography 
                  component="h1" 
                  variant="h4" 
                  sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                    textAlign: 'center',
                  }}
                >
                  アカウント作成
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  textAlign="center"
                  sx={{ 
                    maxWidth: 400,
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  言語学習コミュニティに参加して
                  <br />
                  新しい学習の旅を始めましょう
                </Typography>
              </Box>

              <Divider sx={{ mb: 4, borderColor: 'rgba(0, 0, 0, 0.08)' }} />

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
                  helperText="6文字以上で入力してください"
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
                    py: 1.8,
                    mb: 3,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      transition: 'left 0.5s',
                    },
                    '&:hover:before': {
                      left: '100%',
                    },
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
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

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontWeight: 400,
            }}
          >
            © 2024 言語学習コミュニティ. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage; 