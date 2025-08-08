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
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { Language, EmailOutlined, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { isDarkMode } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/community');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (event: any) => {
    changeLanguage(event.target.value);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: { xs: 1, sm: 2 },
        position: 'relative',
      }}
    >
      {/* 言語切り替えボタン */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1,
        }}
      >
        <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 120 } }}>
          <Select
            value={currentLanguage}
            onChange={handleLanguageChange}
            displayEmpty
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              '& .MuiSelect-select': {
                py: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              },
            }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ja">日本語</MenuItem>
            <MenuItem value="jaSimple">かんたんな、にほんご</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Container component="main" maxWidth="sm">
        <Fade in timeout={800}>
          <Card 
            elevation={0}
            sx={{ 
              backgroundColor: isDarkMode ? 'background.paper' : '#ffffff',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 3,
              boxShadow: isDarkMode 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
                    color: isDarkMode ? 'primary.main' : '#1e40af',
                    mb: 1,
                    textAlign: 'center',
                    fontSize: { xs: '1.5rem', sm: '2.125rem' },
                  }}
                >
                  {t('loginTitle')}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="text.primary" 
                  textAlign="center"
                  sx={{ 
                    maxWidth: 400,
                    lineHeight: 1.6,
                    fontWeight: 400,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {t('loginSubtitle')}
                </Typography>
              </Box>

              <Divider sx={{ mb: { xs: 3, sm: 4 }, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }} />

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
                  id="email"
                  label={t('email')}
                  name="email"
                  autoComplete="email"
                  autoFocus
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
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.12)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.23)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: isDarkMode ? 'primary.main' : 'primary.main',
                      },
                    },
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label={t('password')}
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.12)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.23)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: isDarkMode ? 'primary.main' : 'primary.main',
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
                  {isLoading ? t('loginInProgress') : t('login')}
                </Button>
                
                <Box textAlign="center">
                  <Link
                    component={RouterLink}
                    to="/register"
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
                    {t('noAccount')}
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

export default LoginPage; 