import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import axios from 'axios';

interface MonthlyUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MonthlyUpdateDialog: React.FC<MonthlyUpdateDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [reflection, setReflection] = useState('');
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      await axios.post('/api/auth/monthly-update', {
        reflection,
        goal,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('月次更新エラー:', error);
      setError(error.response?.data?.error || '月次更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReflection('');
    setGoal('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          新しい月が始まりました！
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          先月の振り返りと今月の目標を設定しましょう
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            先月の振り返り
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="先月の学習や活動について振り返ってみましょう..."
            variant="outlined"
            sx={{ mb: 3 }}
          />

          <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
            今月の目標
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="今月達成したい目標を設定しましょう..."
            variant="outlined"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MonthlyUpdateDialog; 