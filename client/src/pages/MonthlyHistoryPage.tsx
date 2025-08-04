import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import {
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface MonthlyEntry {
  year: number;
  month: number;
  reflection: string;
  goal: string;
  last_monthly_update: string;
}

const MonthlyHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [monthlyData, setMonthlyData] = useState<MonthlyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/auth/monthly-history/${user?.id}`);
        console.log('Monthly history response:', response.data);
        
        if (response.data.monthlyEntries) {
          setMonthlyData(response.data.monthlyEntries);
        } else {
          setError('月次データが見つかりません');
        }
      } catch (error: any) {
        console.error('月次履歴取得エラー:', error);
        setError(error.response?.data?.error || '月次履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchMonthlyHistory();
    }
  }, [user?.id]);

  const formatDate = (year: number, month: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getMonthLabel = (month: number) => {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month - 1];
  };

  const getCurrentMonthData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return monthlyData.find(entry => 
      entry.year === currentYear && entry.month === currentMonth
    );
  };

  const getPreviousMonthData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let previousYear = currentYear;
    let previousMonth = currentMonth - 1;
    
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = currentYear - 1;
    }
    
    return monthlyData.find(entry => 
      entry.year === previousYear && entry.month === previousMonth
    );
  };

  const getHistoricalData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return monthlyData.filter(entry => 
      !(entry.year === currentYear && entry.month === currentMonth) &&
      !(entry.year === currentYear && entry.month === currentMonth - 1) &&
      !(entry.year === currentYear - 1 && entry.month === 12 && currentMonth === 1)
    ).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const currentMonthData = getCurrentMonthData();
  const previousMonthData = getPreviousMonthData();
  const historicalData = getHistoricalData();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          gap: 2
        }}>
          <HistoryIcon sx={{ 
            color: 'primary.main',
            fontSize: { xs: 28, sm: 32 }
          }} />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            月次振り返り・目標履歴
          </Typography>
        </Box>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          これまでに記録した月次振り返りと目標の履歴を確認できます
        </Typography>
      </Box>

      {/* 現在の月のデータ */}
      {currentMonthData && (
        <Card sx={{ mb: 4, border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              gap: 1
            }}>
              <TrendingUpIcon sx={{ 
                color: 'primary.main',
                fontSize: { xs: 24, sm: 28 }
              }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                今月の振り返り・目標
              </Typography>
              <Chip 
                label={formatDate(currentMonthData.year, currentMonthData.month)}
                color="primary"
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: 'primary.main'
                    }}
                  >
                    今月の目標
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {currentMonthData.goal || 'まだ設定されていません'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: 'primary.main'
                    }}
                  >
                    先月の振り返り
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {currentMonthData.reflection || 'まだ記録されていません'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 先月のデータ */}
      {previousMonthData && (
        <Card sx={{ mb: 4, border: '1px solid', borderColor: 'grey.300' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              gap: 1
            }}>
              <CalendarIcon sx={{ 
                color: 'secondary.main',
                fontSize: { xs: 24, sm: 28 }
              }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                先月の振り返り・目標
              </Typography>
              <Chip 
                label={formatDate(previousMonthData.year, previousMonthData.month)}
                color="secondary"
                size="small"
                sx={{ ml: 'auto' }}
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: 'secondary.main'
                    }}
                  >
                    先月の目標
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {previousMonthData.goal || '記録されていません'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: 'secondary.main'
                    }}
                  >
                    先月の振り返り
                  </Typography>
                  <Typography 
                    variant="body1"
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {previousMonthData.reflection || '記録されていません'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 過去の履歴 */}
      {historicalData.length > 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              gap: 1
            }}>
              <PersonIcon sx={{ 
                color: 'text.secondary',
                fontSize: { xs: 24, sm: 28 }
              }} />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                過去の履歴
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {historicalData.map((entry, index) => (
                <Grid item xs={12} key={`${entry.year}-${entry.month}`}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        gap: 1
                      }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}
                        >
                          {formatDate(entry.year, entry.month)}
                        </Typography>
                        <Chip 
                          label={`${entry.year}年${getMonthLabel(entry.month)}`}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 1,
                              color: 'text.secondary'
                            }}
                          >
                            目標
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              whiteSpace: 'pre-wrap',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            {entry.goal || '記録されていません'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 1,
                              color: 'text.secondary'
                            }}
                          >
                            振り返り
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              whiteSpace: 'pre-wrap',
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            {entry.reflection || '記録されていません'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {monthlyData.length === 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              まだ月次振り返り・目標の記録がありません
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
            >
              月次更新ダイアログで振り返りと目標を記録すると、ここに履歴が表示されます
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default MonthlyHistoryPage; 