import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface StudyLogPostProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  channelId: number;
}

const StudyLogPost: React.FC<StudyLogPostProps> = ({ open, onClose, onSuccess, channelId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [aiResponseEnabled, setAiResponseEnabled] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ユーザーのロールから学習言語を推測
  useEffect(() => {
    if (user?.role) {
      if (user.role.includes('ECG') || user.role === 'ECGメンバー') {
        setTargetLanguage('English');
      } else if (user.role.includes('JCG') || user.role === 'JCGメンバー') {
        setTargetLanguage('Japanese');
      }
    }
  }, [user]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB制限
        setError('画像サイズは5MB以下にしてください');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setImagePreview(result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('学習内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`/api/study-log/channels/${channelId}/study-posts`, {
        content,
        aiResponseEnabled,
        targetLanguage,
        image_url: selectedImage
      });

      if (response.data.success) {
        setGeneratedTags(response.data.tags || []);
        onSuccess();
        handleClose();
      }
    } catch (error: any) {
      console.error('学習ログ投稿エラー:', error);
      setError(error.response?.data?.error || '投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setSelectedImage(null);
    setImagePreview(null);
    setGeneratedTags([]);
    setError(null);
    setIsSubmitting(false);
    onClose();
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
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            学習ログを投稿
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            今日学んだ表現や発見したことを共有しましょう！
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="例：今日は「take it easy」という表現を学びました。「気楽にいこう」という意味で、友達との会話でよく使われるそうです。"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 3 }}
          />

          {/* 画像プレビュー */}
          {imagePreview && (
            <Box sx={{ mb: 2, position: 'relative' }}>
              <img
                src={imagePreview}
                alt="プレビュー"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
              <IconButton
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          {/* 画像アップロードボタン */}
          <Button
            component="label"
            startIcon={<ImageIcon />}
            sx={{ mb: 3 }}
          >
            画像を追加
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageSelect}
            />
          </Button>

          {/* 学習言語選択 */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>学習言語</InputLabel>
            <Select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              label="学習言語"
            >
              <MenuItem value="English">English（英語学習）</MenuItem>
              <MenuItem value="Japanese">Japanese（日本語学習）</MenuItem>
            </Select>
          </FormControl>

          {/* AI返信の設定 */}
          <FormControlLabel
            control={
              <Switch
                checked={aiResponseEnabled}
                onChange={(e) => setAiResponseEnabled(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  AI返信を有効にする
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  投稿に対してAIが学習サポートのコメントを自動生成します
                </Typography>
              </Box>
            }
          />

          {/* 生成されたタグ（投稿後に表示） */}
          {generatedTags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                自動生成されたタグ:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {generatedTags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!content.trim() || isSubmitting}
          startIcon={isSubmitting ? undefined : <SendIcon />}
          sx={{ minWidth: 120 }}
        >
          {isSubmitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress sx={{ width: 80, height: 3 }} />
            </Box>
          ) : (
            '投稿する'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudyLogPost; 