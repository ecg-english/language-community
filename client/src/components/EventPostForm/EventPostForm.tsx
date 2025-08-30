import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface EventPostFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  channelId: number;
}

const EventPostForm: React.FC<EventPostFormProps> = ({
  open,
  onClose,
  onSuccess,
  channelId
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('画像サイズは5MB以下にしてください');
        return;
      }

      setCoverImage(file);
      
      // プレビュー作成
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.event_date) {
      setError('タイトルと開催日は必須です');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let coverImageUrl = '';
      
      // カバー画像をアップロード
      if (coverImage) {
        // ファイルをbase64に変換
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
        });
        reader.readAsDataURL(coverImage);
        
        const imageData = await base64Promise;
        
        const uploadResponse = await axios.post('/api/events/upload/cover', {
          imageData: imageData,
          fileName: coverImage.name
        });
        coverImageUrl = uploadResponse.data.imageUrl;
      }

      // イベント投稿を作成
      const eventData = {
        ...formData,
        cover_image: coverImageUrl,
        channel_id: channelId
      };

      console.log('イベント投稿データ:', eventData);
      const response = await axios.post('/api/events', eventData);
      console.log('イベント投稿レスポンス:', response.data);

      // フォームをリセット
      setFormData({
        title: '',
        description: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
      });
      setCoverImage(null);
      setCoverImagePreview(null);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('イベント投稿エラー:', error);
      setError(error.response?.data?.error || 'イベントの投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {t('postEvent')}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* カバー画像 */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {t('coverImage')}
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => document.getElementById('cover-image-input')?.click()}
              >
                {coverImagePreview ? (
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={coverImagePreview}
                      alt={t('coverImagePreview')}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <Box>
                    <PhotoCameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {t('selectCoverImage')}
                    </Typography>
                  </Box>
                )}
                <input
                  id="cover-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </Box>
            </Box>
          </Grid>

          {/* タイトル */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={`${t('eventTitle')} *`}
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </Grid>

          {/* 説明 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="イベント説明"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </Grid>

          {/* 日時 */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="開催日 *"
              type="date"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="場所"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="開始時間"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="終了時間"
              type="time"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.title || !formData.event_date}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? '投稿中...' : '投稿する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventPostForm; 