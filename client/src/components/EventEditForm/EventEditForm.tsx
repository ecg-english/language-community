import React, { useState, useEffect } from 'react';
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
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface EventEditFormProps {
  open: boolean;
  onClose: () => void;
  event: {
    id: number;
    title: string;
    description: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location: string;
    cover_image?: string;
  };
  onSuccess: () => void;
}

const EventEditForm: React.FC<EventEditFormProps> = ({
  open,
  onClose,
  event,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location,
      });
      setCoverImageUrl(event.cover_image || '');
    }
  }, [event]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MB制限）
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください');
        return;
      }

      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルを選択してください');
        return;
      }

      setCoverImage(file);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImageUrl('');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      let finalCoverImageUrl = coverImageUrl;

      // 新しい画像が選択された場合、アップロード
      if (coverImage) {
        const formData = new FormData();
        formData.append('cover_image', coverImage);

        const uploadResponse = await axios.post('/api/events/upload/cover', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        finalCoverImageUrl = uploadResponse.data.imageUrl;
      }

      // イベント更新
      const updateData = {
        ...formData,
        cover_image: finalCoverImageUrl,
      };

      await axios.put(`/api/events/${event.id}`, updateData);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('イベント更新エラー:', error);
      setError('イベントの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">イベントを編集</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* カバー画像 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              カバー画像
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {(coverImageUrl || coverImage) && (
                <Box
                  sx={{
                    width: 100,
                    height: 60,
                    backgroundImage: coverImageUrl 
                      ? `url(https://language-community-backend.onrender.com${coverImageUrl})` 
                      : coverImage 
                        ? `url(${URL.createObjectURL(coverImage)})` 
                        : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 1,
                    border: '1px solid #ddd',
                  }}
                />
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={isSubmitting}
              >
                カバー画像を選択
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </Button>
              {(coverImageUrl || coverImage) && (
                <IconButton onClick={handleRemoveImage} color="error">
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* イベントタイトル */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="イベントタイトル *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isSubmitting}
            />
          </Grid>

          {/* イベント説明 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="イベント説明"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
            />
          </Grid>

          {/* 開催日 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="開催日 *"
              type="date"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 場所 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="場所"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={isSubmitting}
            />
          </Grid>

          {/* 開始時間 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="開始時間"
              type="time"
              value={formData.start_time}
              onChange={(e) => handleInputChange('start_time', e.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* 終了時間 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="終了時間"
              type="time"
              value={formData.end_time}
              onChange={(e) => handleInputChange('end_time', e.target.value)}
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={isSubmitting || !formData.title || !formData.event_date}
        >
          {isSubmitting ? <CircularProgress size={20} /> : '更新する'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventEditForm; 