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
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          {/* ヘッダー部分 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3,
              }}
            >
              {profileData.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {isEditing ? (
                  <TextField
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 2, minWidth: 200 }}
                  />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 600, mr: 2 }}>
                    {profileData.username}
                  </Typography>
                )}
                <Chip
                  label={profileData.role}
                  color={getRoleColor(profileData.role) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                  <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="caption">
                    {formatDate(profileData.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {isOwnProfile && (
              <Box>
                {isEditing ? (
                  <>
                    <IconButton
                      onClick={handleSave}
                      disabled={isSaving}
                      color="primary"
                      sx={{ mr: 1 }}
                    >
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={handleCancel} color="error">
                      <CancelIcon />
                    </IconButton>
                  </>
                ) : (
                  <IconButton onClick={handleEdit} color="primary">
                    <EditIcon />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* プロフィール詳細 */}
          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* 目標 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
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
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: 60,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {profileData.goal || '目標が設定されていません'}
                </Typography>
              )}
            </Box>

            {/* 一言メッセージ */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MessageIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
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
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: 60,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {profileData.message || 'メッセージが設定されていません'}
                </Typography>
              )}
            </Box>

            {/* 自己紹介 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
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
                />
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    minHeight: 80,
                    display: 'flex',
                    alignItems: 'flex-start',
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