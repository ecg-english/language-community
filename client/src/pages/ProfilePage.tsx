import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  bio: string;
  avatar_url?: string;
  created_at: string;
  goal?: string;
  message?: string;
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isOwnProfile = user?.id.toString() === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/auth/users/${userId}`);
        setProfileData(response.data.user);
        setEditData({
          username: response.data.user.username,
          bio: response.data.user.bio || '',
          goal: response.data.user.goal || '',
          message: response.data.user.message || '',
        });
      } catch (error: any) {
        console.error('プロフィール取得エラー:', error);
        if (error.response?.status === 404) {
          setError('ユーザーが見つかりません');
        } else {
          setError('プロフィールの取得に失敗しました');
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      username: profileData?.username || '',
      bio: profileData?.bio || '',
      goal: profileData?.goal || '',
      message: profileData?.message || '',
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await axios.put('/api/auth/profile', editData);
      
      setProfileData(response.data.user);
      setIsEditing(false);
      
      // 自分のプロフィールを編集した場合、AuthContextも更新
      if (isOwnProfile) {
        updateUser(response.data.user);
      }
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <Typography>プロフィールが見つかりません</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          {/* ヘッダー部分 */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 3,
            gap: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' }
            }}>
              <Avatar
                sx={{
                  width: { xs: 60, sm: 80 },
                  height: { xs: 60, sm: 80 },
                  bgcolor: 'primary.main',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  mr: { xs: 2, sm: 3 },
                }}
              >
                {profileData.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' }, 
                  mb: 1,
                  gap: { xs: 1, sm: 2 }
                }}>
                  {isEditing ? (
                    <TextField
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      variant="outlined"
                      size="small"
                      sx={{ 
                        mr: { xs: 0, sm: 2 }, 
                        minWidth: { xs: '100%', sm: 200 },
                        mb: { xs: 1, sm: 0 }
                      }}
                    />
                  ) : (
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600, 
                        mr: { xs: 0, sm: 2 },
                        fontSize: { xs: '1.5rem', sm: '2.125rem' },
                        mb: { xs: 1, sm: 0 }
                      }}
                    >
                      {profileData.username}
                    </Typography>
                  )}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'row', sm: 'row' },
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap'
                  }}>
                    <Chip
                      label={profileData.role}
                      color={getRoleColor(profileData.role) as any}
                      size="small"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        height: { xs: 24, sm: 28 }
                      }}
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: 'text.secondary',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>
                      <CalendarIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5 }} />
                      <Typography variant="caption">
                        {formatDate(profileData.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            {isOwnProfile && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                mt: { xs: 2, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'flex-end', sm: 'flex-start' }
              }}>
                {isEditing ? (
                  <>
                    <IconButton
                      onClick={handleSave}
                      disabled={isSaving}
                      color="primary"
                      sx={{ 
                        p: { xs: 1, sm: 1.5 },
                        '&:hover': {
                          backgroundColor: 'rgba(30, 64, 175, 0.04)',
                        },
                      }}
                    >
                      <SaveIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </IconButton>
                    <IconButton 
                      onClick={handleCancel} 
                      color="error"
                      sx={{ 
                        p: { xs: 1, sm: 1.5 },
                        '&:hover': {
                          backgroundColor: 'rgba(220, 38, 38, 0.04)',
                        },
                      }}
                    >
                      <CancelIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    </IconButton>
                  </>
                ) : (
                  <IconButton 
                    onClick={handleEdit} 
                    color="primary"
                    sx={{ 
                      p: { xs: 1, sm: 1.5 },
                      '&:hover': {
                        backgroundColor: 'rgba(30, 64, 175, 0.04)',
                      },
                    }}
                  >
                    <EditIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* プロフィール詳細 */}
          <Box sx={{ display: 'grid', gap: { xs: 2, sm: 3 } }}>
            {/* 目標 */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                gap: 1
              }}>
                <SchoolIcon sx={{ 
                  mr: 1, 
                  color: 'primary.main',
                  fontSize: { xs: 20, sm: 24 }
                }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  学習目標
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={editData.goal || ''}
                  onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                  placeholder="学習目標を入力してください..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                  }}
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: { xs: 50, sm: 60 },
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {profileData.goal || '目標が設定されていません'}
                </Typography>
              )}
            </Box>

            {/* 一言メッセージ */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                gap: 1
              }}>
                <MessageIcon sx={{ 
                  mr: 1, 
                  color: 'primary.main',
                  fontSize: { xs: 20, sm: 24 }
                }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  一言メッセージ
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={editData.message || ''}
                  onChange={(e) => setEditData({ ...editData, message: e.target.value })}
                  placeholder="一言メッセージを入力してください..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                  }}
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: { xs: 50, sm: 60 },
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {profileData.message || 'メッセージが設定されていません'}
                </Typography>
              )}
            </Box>

            {/* 自己紹介 */}
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 1,
                gap: 1
              }}>
                <PersonIcon sx={{ 
                  mr: 1, 
                  color: 'primary.main',
                  fontSize: { xs: 20, sm: 24 }
                }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  自己紹介
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  placeholder="自己紹介を入力してください..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    },
                  }}
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: { xs: 70, sm: 80 },
                    display: 'flex',
                    alignItems: 'flex-start',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {profileData.bio || '自己紹介が設定されていません'}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage; 