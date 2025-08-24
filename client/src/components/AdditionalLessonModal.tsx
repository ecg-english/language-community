import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  TextField
} from '@mui/material';
import axios from 'axios';

interface Student {
  id: number;
  name: string;
  instructor_name: string;
}

interface AdditionalLessonModalProps {
  open: boolean;
  onClose: () => void;
  weekKey: string;
  onSuccess: () => void;
}

const AdditionalLessonModal: React.FC<AdditionalLessonModalProps> = ({
  open,
  onClose,
  weekKey,
  onSuccess
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [dmScheduled, setDmScheduled] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [nextLessonDate, setNextLessonDate] = useState('');
  const [lessonCompletedDate, setLessonCompletedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生徒一覧を取得
  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/class1/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students);
    } catch (error) {
      console.error('生徒一覧取得エラー:', error);
      setError('生徒一覧の取得に失敗しました');
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      setError('生徒を選択してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/additional-lessons', {
        student_id: selectedStudent,
        week_key: weekKey,
        dm_scheduled: dmScheduled,
        lesson_completed: lessonCompleted,
        next_lesson_date: nextLessonDate,
        lesson_completed_date: lessonCompletedDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('追加レッスン作成エラー:', error);
      setError('追加レッスンの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent('');
    setDmScheduled(false);
    setLessonCompleted(false);
    setNextLessonDate('');
    setLessonCompletedDate('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>追加レッスン登録</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>生徒を選択</InputLabel>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(Number(e.target.value))}
              label="生徒を選択"
            >
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.name} (担当: {student.instructor_name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="h6" sx={{ mb: 2 }}>
            週: {weekKey}
          </Typography>

          {/* DMで次回レッスン日を調整 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Checkbox
                checked={dmScheduled}
                disabled
                sx={{
                  color: 'primary.main',
                  '&.Mui-checked': {
                    color: 'success.main',
                    animation: 'glow 2s ease-in-out infinite alternate',
                    '@keyframes glow': {
                      '0%': {
                        boxShadow: '0 0 5px #4caf50',
                      },
                      '100%': {
                        boxShadow: '0 0 20px #4caf50, 0 0 30px #4caf50',
                      },
                    },
                  },
                }}
              />
              <Typography variant="body2">
                DMで次回レッスン日を調整した
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
              日付を入力すると完了になります
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 4, mt: 1 }}>
              <TextField
                type="date"
                size="small"
                value={nextLessonDate}
                onChange={(e) => {
                  setNextLessonDate(e.target.value);
                  setDmScheduled(!!e.target.value);
                }}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setNextLessonDate(today);
                  setDmScheduled(true);
                }}
              >
                今日を設定
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: 1, display: 'block' }}>
              次回レッスン予定日を記録
            </Typography>
          </Box>

          {/* レッスンを実施 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Checkbox
                checked={lessonCompleted}
                disabled
                sx={{
                  color: 'primary.main',
                  '&.Mui-checked': {
                    color: 'success.main',
                    animation: 'glow 2s ease-in-out infinite alternate',
                    '@keyframes glow': {
                      '0%': {
                        boxShadow: '0 0 5px #4caf50',
                      },
                      '100%': {
                        boxShadow: '0 0 20px #4caf50, 0 0 30px #4caf50',
                      },
                    },
                  },
                }}
              />
              <Typography variant="body2">
                レッスンを実施した
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
              日付を入力すると完了になります
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 4, mt: 1 }}>
              <TextField
                type="date"
                size="small"
                value={lessonCompletedDate}
                onChange={(e) => {
                  setLessonCompletedDate(e.target.value);
                  setLessonCompleted(!!e.target.value);
                }}
                sx={{ flex: 1 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setLessonCompletedDate(today);
                  setLessonCompleted(true);
                }}
              >
                今日を設定
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: 1, display: 'block' }}>
              実施日を記録
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !selectedStudent}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdditionalLessonModal; 