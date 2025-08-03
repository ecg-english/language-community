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
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Message as MessageIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  bio: string;
  avatar_url?: string;
  created_at: string;
  message?: string;
  native_language?: string;
  target_languages?: string;
  country?: string;
  timezone?: string;
  monthly_reflection?: string;
  monthly_goal?: string;
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
          message: response.data.user.message || '',
          avatar_url: response.data.user.avatar_url || '',
          native_language: response.data.user.native_language || '',
          target_languages: response.data.user.target_languages || '',
          country: response.data.user.country || '',
          timezone: response.data.user.timezone || '',
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
      avatar_url: profileData?.avatar_url || '',
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      let avatarUrl = editData.avatar_url;

      // 新しいファイルが選択されている場合はアップロード
      if (selectedFile) {
        const formData = new FormData();
        formData.append('avatar', selectedFile);

        const uploadResponse = await axios.post('/api/upload/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        avatarUrl = uploadResponse.data.fileUrl;
      }

      // プロフィール更新
      const response = await axios.put('/api/auth/profile', {
        username: editData.username,
        bio: editData.bio,
        message: editData.message,
        avatar_url: avatarUrl,
        native_language: editData.native_language,
        target_languages: editData.target_languages,
        country: editData.country,
        timezone: editData.timezone,
      });

      setProfileData(response.data.user);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      // 自分のプロフィールの場合はAuthContextも更新
      if (isOwnProfile) {
        updateUser(response.data.user);
      }
    } catch (error: any) {
      console.error('プロフィール更新エラー:', error);
      setError(error.response?.data?.error || 'プロフィールの更新に失敗しました');
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
                src={profileData.avatar_url ? `https://language-community-backend.onrender.com${profileData.avatar_url}` : undefined}
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
            {/* アバター */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                アバター
              </Typography>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="avatar-upload-input"
              />
              <label htmlFor="avatar-upload-input">
                <IconButton
                  component="span"
                  color="primary"
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      backgroundColor: 'rgba(30, 64, 175, 0.04)',
                    },
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </IconButton>
              </label>
            </Box>
            {previewUrl && (
              <Avatar
                src={previewUrl}
                sx={{
                  width: { xs: 100, sm: 120 },
                  height: { xs: 100, sm: 120 },
                  border: '1px solid #ccc',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              />
            )}

            {/* 母語 */}
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
                  母語
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editData.native_language || ''}
                  onChange={(e) => setEditData({ ...editData, native_language: e.target.value })}
                  placeholder="母語を入力してください..."
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
                  {profileData.native_language || '未設定'}
                </Typography>
              )}
            </Box>

            {/* 学習したい言語 */}
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
                  学習したい言語
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={editData.target_languages || ''}
                  onChange={(e) => setEditData({ ...editData, target_languages: e.target.value })}
                  placeholder="学習したい言語を入力してください..."
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
                  {profileData.target_languages || '未設定'}
                </Typography>
              )}
            </Box>

            {/* 現在の国 */}
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
                  現在の国
                </Typography>
              </Box>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={editData.country || ''}
                  onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                  placeholder="現在の国を入力してください..."
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
                  {profileData.country || '未設定'}
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
                  {t('oneWordMessage')}
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
                  {profileData.message || t('messageNotSet')}
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
                  {t('selfIntroduction')}
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
                  {profileData.bio || t('bioNotSet')}
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