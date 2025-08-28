import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  visitor_fee: number;
  member_fee: number;
  location: string;
  created_at: string;
  tasks?: Task[];
}

interface Task {
  id: number;
  event_id: number;
  name: string;
  deadline_days_before: number;
  deadline_date: string;
  is_completed: boolean;
  url?: string;
}

const EventPlanningPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createEventDialog, setCreateEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [taskDialog, setTaskDialog] = useState(false);

  // 新規イベント作成フォーム
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    visitor_fee: '',
    member_fee: '',
    location: ''
  });

  // デフォルトタスクテンプレート
  const defaultTasks = [
    { name: 'イベント企画書作成', deadline_days_before: 30, url: '' },
    { name: 'フライヤー作成とLINEで共有', deadline_days_before: 30, url: 'https://utage-system.com/operator/thOIhLyBdzs4/login' },
    { name: 'Instagram投稿', deadline_days_before: 25, url: 'https://www.instagram.com/english_ecg/' },
    { name: 'コミュニティ投稿', deadline_days_before: 30, url: 'https://ecg-english.github.io/language-community' },
    { name: '公式LINE予約投稿', deadline_days_before: 30, url: 'https://utage-system.com/operator/thOIhLyBdzs4/login' },
    { name: '印刷して店舗張り出し', deadline_days_before: 30, url: '' },
    { name: 'Meetup投稿', deadline_days_before: 7, url: '' },
    { name: 'Instagramで単体投稿', deadline_days_before: 7, url: 'https://www.instagram.com/english_ecg/' },
    { name: 'ストーリー投稿', deadline_days_before: 7, url: 'https://www.instagram.com/english_ecg/' },
    { name: 'イベント準備物確認と買い出し', deadline_days_before: 3, url: '' },
    { name: 'ストーリー再投稿', deadline_days_before: 1, url: 'https://www.instagram.com/english_ecg/' },
    { name: 'コミュニティのお知らせ投稿やアクティビティ', deadline_days_before: 1, url: 'https://ecg-english.github.io/language-community' },
    { name: 'イベント実施と反省メモ', deadline_days_before: 0, url: '' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('イベント取得エラー:', error);
      setError('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/events', newEvent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        await fetchEvents();
        setCreateEventDialog(false);
        setNewEvent({
          title: '',
          description: '',
          event_date: '',
          start_time: '',
          end_time: '',
          visitor_fee: '',
          member_fee: '',
          location: ''
        });
        alert('イベントを作成しました！');
      }
    } catch (error) {
      console.error('イベント作成エラー:', error);
      alert('イベントの作成に失敗しました');
    }
  };

  const handleTaskToggle = async (taskId: number, isCompleted: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/events/tasks/${taskId}`, 
        { is_completed: !isCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 選択されたイベントのタスクを更新
      if (selectedEvent) {
        const updatedTasks = selectedEvent.tasks?.map(task => 
          task.id === taskId ? { ...task, is_completed: !isCompleted } : task
        ) || [];
        setSelectedEvent({ ...selectedEvent, tasks: updatedTasks });
      }
    } catch (error) {
      console.error('タスク更新エラー:', error);
      alert('タスクの更新に失敗しました');
    }
  };

  const openTaskDialog = async (event: Event) => {
    try {
      console.log('タスクダイアログを開く:', { eventId: event.id, eventTitle: event.title });
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/events/${event.id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('タスク取得レスポンス:', response.data);
      
      setSelectedEvent({ ...event, tasks: response.data.data || [] });
      setTaskDialog(true);
      
      console.log('タスクダイアログが開かれました');
    } catch (error) {
      console.error('タスク取得エラー:', error);
      console.error('エラー詳細:', (error as any)?.response?.data);
      alert('タスクの取得に失敗しました');
    }
  };

  const getTaskStatus = (task: Task) => {
    const today = new Date();
    const deadline = new Date(task.deadline_date);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (task.is_completed) {
      return { status: 'completed', color: 'success', icon: <CheckCircleIcon /> };
    } else if (diffDays < 0) {
      return { status: 'overdue', color: 'error', icon: <ErrorIcon /> };
    } else if (diffDays <= 3) {
      return { status: 'urgent', color: 'warning', icon: <WarningIcon /> };
    } else {
      return { status: 'pending', color: 'default', icon: <ScheduleIcon /> };
    }
  };

  const getEventProgress = (event: Event) => {
    if (!event.tasks || event.tasks.length === 0) return 0;
    const completedTasks = event.tasks.filter(task => task.is_completed).length;
    return (completedTasks / event.tasks.length) * 100;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>読み込み中...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          イベント企画管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateEventDialog(true)}
        >
          企画開始
        </Button>
      </Box>

      {events.length === 0 ? (
        <Box textAlign="center" py={8}>
          <EventIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            まだイベントが企画されていません
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            「企画開始」ボタンからイベントの企画を始めましょう
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateEventDialog(true)}
          >
            企画開始
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => openTaskDialog(event)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {event.description.length > 100 
                      ? `${event.description.substring(0, 100)}...`
                      : event.description
                    }
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventIcon sx={{ fontSize: 16, mr: 1 }} />
                      {new Date(event.event_date).toLocaleDateString('ja-JP')} 
                      {event.start_time} - {event.end_time}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📍 {event.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`メンバー: ¥${event.member_fee}`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`ビジター: ¥${event.visitor_fee}`} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  </Box>

                  {event.tasks && event.tasks.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        進捗: {Math.round(getEventProgress(event))}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={getEventProgress(event)} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* イベント作成ダイアログ */}
      <Dialog open={createEventDialog} onClose={() => setCreateEventDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>新規イベント企画</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="イベントタイトル"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="イベント内容"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              required
            />

            <TextField
              fullWidth
              label="開催日"
              type="date"
              value={newEvent.event_date}
              onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              required
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="開始時刻"
                type="time"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="終了時刻"
                type="time"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="メンバー料金 (円)"
                type="number"
                value={newEvent.member_fee}
                onChange={(e) => setNewEvent({ ...newEvent, member_fee: e.target.value })}
                required
              />
              <TextField
                label="ビジター料金 (円)"
                type="number"
                value={newEvent.visitor_fee}
                onChange={(e) => setNewEvent({ ...newEvent, visitor_fee: e.target.value })}
                required
              />
            </Box>

            <TextField
              fullWidth
              label="開催場所"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateEventDialog(false)}>キャンセル</Button>
          <Button 
            onClick={handleCreateEvent} 
            variant="contained"
            disabled={!newEvent.title || !newEvent.event_date || !newEvent.start_time || !newEvent.end_time}
          >
            企画作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* タスクチェックリストダイアログ */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEvent?.title} - タスクチェックリスト
        </DialogTitle>
        <DialogContent>
          {selectedEvent ? (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                開催日: {new Date(selectedEvent.event_date).toLocaleDateString('ja-JP')} 
                {selectedEvent.start_time} - {selectedEvent.end_time}
              </Typography>

              {selectedEvent.tasks && selectedEvent.tasks.length > 0 ? (
                selectedEvent.tasks.map((task) => {
                  const taskStatus = getTaskStatus(task);
                  return (
                    <Box 
                      key={task.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        p: 2, 
                        mb: 1,
                        border: 1,
                        borderColor: `${taskStatus.color}.main`,
                        borderRadius: 1,
                        backgroundColor: task.is_completed ? 'success.light' : 
                                      taskStatus.status === 'overdue' ? 'error.light' :
                                      taskStatus.status === 'urgent' ? 'warning.light' : 'transparent',
                        opacity: task.is_completed ? 0.7 : 1
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            textDecoration: task.is_completed ? 'line-through' : 'none',
                            fontWeight: task.is_completed ? 'normal' : 500
                          }}
                        >
                          {task.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          締切: {new Date(task.deadline_date).toLocaleDateString('ja-JP')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {task.url && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(task.url, '_blank');
                            }}
                          >
                            リンク
                          </Button>
                        )}
                        <Button
                          variant={task.is_completed ? "outlined" : "contained"}
                          color={taskStatus.color as any}
                          onClick={() => handleTaskToggle(task.id, task.is_completed)}
                          startIcon={taskStatus.icon}
                        >
                          {task.is_completed ? '完了済み' : '完了'}
                        </Button>
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    タスクが見つかりません
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                イベント情報を読み込み中...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventPlanningPage; 