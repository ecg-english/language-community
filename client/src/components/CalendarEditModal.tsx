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
  Box,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Student {
  id: number;
  name: string;
  instructor_name: string;
}

interface CalendarEvent {
  studentId: number;
  studentName: string;
  type: 'scheduled' | 'completed';
  source?: 'regular' | 'additional';
}

interface CalendarEditModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  students: Student[];
  events: CalendarEvent[];
  onSuccess: () => void;
}

const CalendarEditModal: React.FC<CalendarEditModalProps> = ({
  open,
  onClose,
  date,
  students,
  events,
  onSuccess
}) => {
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [eventType, setEventType] = useState<'scheduled' | 'completed' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedStudent('');
    setEventType('none');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedStudent || eventType === 'none') {
      setError('生徒を選択してイベントタイプを設定してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      if (eventType === 'scheduled' || eventType === 'completed') {
        // イベントを作成・更新
        await axios.post('/api/calendar-events', {
          student_id: selectedStudent,
          date: date,
          type: eventType
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('カレンダーイベント更新エラー:', error);
      setError('カレンダーイベントの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (studentId: number) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete('/api/calendar-events', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          student_id: studentId,
          date: date
        }
      });

      onSuccess();
    } catch (error) {
      console.error('カレンダーイベント削除エラー:', error);
      setError('カレンダーイベントの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formatDate(date)} のレッスン管理
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 既存のイベント一覧 */}
          {events.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                現在の予定・実施状況
              </Typography>
              <List>
                {events.map((event, index) => (
                  <ListItem key={index} sx={{ 
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }}>
                    <ListItemIcon>
                      {event.type === 'completed' ? 
                        <CheckCircleIcon color="success" /> : 
                        <StarIcon color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={event.studentName}
                      secondary={event.type === 'completed' ? 'レッスン実施済み' : '次回レッスン予定'}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEvent(event.studentId)}
                      disabled={loading}
                    >
                      削除
                    </Button>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {/* 新しいイベントの追加 */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            新しい予定・実施状況を追加
          </Typography>

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

          <Typography variant="body1" sx={{ mb: 1 }}>
            イベントタイプ
          </Typography>
          <ToggleButtonGroup
            value={eventType}
            exclusive
            onChange={(e, value) => setEventType(value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="scheduled" color="warning">
              <StarIcon sx={{ mr: 1 }} />
              次回レッスン予定
            </ToggleButton>
            <ToggleButton value="completed" color="success">
              <CheckCircleIcon sx={{ mr: 1 }} />
              レッスン実施済み
            </ToggleButton>
            <ToggleButton value="none" color="standard">
              <CancelIcon sx={{ mr: 1 }} />
              設定しない
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          キャンセル
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !selectedStudent || eventType === 'none'}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarEditModal; 