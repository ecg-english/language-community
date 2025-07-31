import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const [users, setUsers] = useState<Member[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/auth/users/public');
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('ユーザー一覧取得エラー:', error);
        setError('ユーザー一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.goal && user.goal.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.message && user.message.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleMemberClick = (memberId: number) => {
    navigate(`/profile/${memberId}`);
  };

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

  const getRoleIcon = (role: string) => {
    if (role.includes('講師')) {
      return <SchoolIcon sx={{ fontSize: 16 }} />;
    }
    return <PersonIcon sx={{ fontSize: 16 }} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleCount = (role: string) => {
    return users.filter(user => user.role === role).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
          メンバー一覧
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          コミュニティのメンバー一覧です。各メンバーをクリックするとプロフィールを確認できます。
        </Typography>

        {/* 統計情報 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            label={`管理者: ${getRoleCount('サーバー管理者')}`}
            color="error"
            size="small"
          />
          <Chip
            label={`講師: ${getRoleCount('ECG講師') + getRoleCount('JCG講師')}`}
            color="warning"
            size="small"
          />
          <Chip
            label={`Class1: ${getRoleCount('Class1 Members')}`}
            color="secondary"
            size="small"
          />
          <Chip
            label={`メンバー: ${getRoleCount('ECGメンバー') + getRoleCount('JCGメンバー')}`}
            color="info"
            size="small"
          />
          <Chip
            label={`Trial: ${getRoleCount('Trial参加者')}`}
            color="default"
            size="small"
          />
          <Chip
            label={`総数: ${users.length}`}
            color="primary"
            size="small"
          />
        </Box>

        {/* 検索バー */}
        <TextField
          fullWidth
          placeholder="名前、ロール、目標、メッセージで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: '1px solid rgba(0, 0, 0, 0.12)',
              },
              '&:hover fieldset': {
                border: '1px solid rgba(0, 0, 0, 0.24)',
              },
              '&.Mui-focused fieldset': {
                border: '2px solid',
                borderColor: 'primary.main',
              },
            },
          }}
        />
      </Box>

      {/* メンバー一覧 */}
      {filteredUsers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            {searchQuery ? '検索結果が見つかりません' : 'メンバーがいません'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                  },
                }}
                onClick={() => handleMemberClick(user.id)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* ヘッダー部分 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        bgcolor: 'primary.main',
                        fontSize: '1.2rem',
                        mr: 2,
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {user.username}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role) as any}
                          size="small"
                          icon={getRoleIcon(user.role)}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <CalendarIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          <Typography variant="caption">
                            {formatDate(user.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* 目標 */}
                  {user.goal && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        学習目標
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {user.goal}
                      </Typography>
                    </Box>
                  )}

                  {/* 一言メッセージ */}
                  {user.message && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        一言メッセージ
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {user.message}
                      </Typography>
                    </Box>
                  )}

                  {/* 自己紹介 */}
                  {user.bio && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        自己紹介
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4,
                        }}
                      >
                        {user.bio}
                      </Typography>
                    </Box>
                  )}

                  {/* プロフィール詳細を見るリンク */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                    <Typography
                      variant="body2"
                      color="primary.main"
                      sx={{ fontWeight: 500, textAlign: 'center' }}
                    >
                      プロフィール詳細を見る →
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MembersPage; 