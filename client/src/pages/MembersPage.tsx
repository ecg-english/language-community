import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface Member {
  id: number;
  username: string;
  email: string;
  role: string;
  bio: string;
  avatar_url?: string;
  goal?: string;
  message?: string;
  created_at: string;
}

const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async () => {
    try {
      console.log('Testing direct endpoint...');
      const response = await axios.get('/api/test/users');
      console.log('Direct test response:', response.data);
      alert('Direct test endpoint works! Users: ' + response.data.users.length);
    } catch (error: any) {
      console.error('Direct test endpoint error:', error);
      alert('Direct test endpoint failed: ' + error.response?.data?.error || error.message);
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching members from:', '/api/auth/users/public');
        const token = localStorage.getItem('token');
        console.log('Token present:', !!token);
        
        // トークンの内容をデコードして確認
        if (token) {
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('Token payload:', payload);
            }
          } catch (e) {
            console.log('Could not decode token payload');
          }
        }
        
        const response = await axios.get('/api/auth/users/public');
        console.log('Response received:', response.data);
        
        if (response.data.users) {
          setMembers(response.data.users);
          setFilteredMembers(response.data.users);
        } else {
          console.error('No users array in response:', response.data);
          setError('レスポンスにユーザー情報が含まれていません');
        }
      } catch (error: any) {
        console.error('ユーザー一覧取得エラー:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        if (error.response?.status === 404) {
          setError('ユーザーが見つかりません。データベースを確認してください。');
        } else if (error.response?.status === 401) {
          setError('認証エラーです。再度ログインしてください。');
        } else if (error.response?.status === 403) {
          setError('アクセス権限がありません。');
        } else {
          setError(t('userListFailed'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [t]);

  useEffect(() => {
    const filtered = members.filter(member =>
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'サーバー管理者':
        return 'error';
      case 'ECG講師':
      case 'JCG講師':
        return 'warning';
      case 'Class1 Members':
        return 'secondary';
      case 'ECGメンバー':
      case 'JCGメンバー':
        return 'info';
      case 'Trial参加者':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'サーバー管理者':
        return '#dc2626';
      case 'ECG講師':
      case 'JCG講師':
        return '#ea580c';
      case 'Class1 Members':
        return '#7c3aed';
      case 'ECGメンバー':
      case 'JCGメンバー':
        return '#2563eb';
      case 'Trial参加者':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getRoleStats = () => {
    const stats = {
      admin: 0,
      instructor: 0,
      class1: 0,
      member: 0,
      trial: 0,
      total: members.length
    };

    members.forEach(member => {
      switch (member.role) {
        case 'サーバー管理者':
          stats.admin++;
          break;
        case 'ECG講師':
        case 'JCG講師':
          stats.instructor++;
          break;
        case 'Class1 Members':
          stats.class1++;
          break;
        case 'ECGメンバー':
        case 'JCGメンバー':
          stats.member++;
          break;
        case 'Trial参加者':
          stats.trial++;
          break;
      }
    });

    return stats;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={testEndpoint}
          sx={{ mb: 2 }}
        >
          テストエンドポイントを試す
        </Button>
      </Container>
    );
  }

  const stats = getRoleStats();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          {t('memberList')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('memberListDescription')}
        </Typography>
      </Box>

      {/* 統計情報 */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="error.main" fontWeight={600}>
                  {stats.admin}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('serverAdmin')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="warning.main" fontWeight={600}>
                  {stats.instructor}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('ecgInstructor')} / {t('jcgInstructor')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="secondary.main" fontWeight={600}>
                  {stats.class1}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Class1
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" color="info.main" fontWeight={600}>
                  {stats.member}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('ecgMember')} / {t('jcgMember')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* 検索 */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder={t('searchPosts')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          {filteredMembers.length} / {members.length} {t('memberList')}
        </Typography>
      </Box>

      {/* メンバー一覧 */}
      <Grid container spacing={3}>
        {filteredMembers.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
              onClick={() => navigate(`/profile/${member.id}`)}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar
                  src={member.avatar_url ? `https://language-community-backend.onrender.com${member.avatar_url}` : undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                  }}
                >
                  {member.username.charAt(0).toUpperCase()}
                </Avatar>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {member.username}
                </Typography>
                
                <Chip
                  label={member.role}
                  size="small"
                  sx={{
                    backgroundColor: getRoleGradient(member.role),
                    color: 'white',
                    fontWeight: 600,
                    mb: 1,
                  }}
                />
                
                <Typography variant="caption" color="text.secondary">
                  {t('registrationDate')}: {formatDate(member.created_at)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredMembers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchQuery ? '検索結果が見つかりません' : 'メンバーがまだいません'}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default MembersPage; 