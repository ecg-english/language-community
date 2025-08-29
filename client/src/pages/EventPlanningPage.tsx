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
  LinearProgress,
  Divider,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Save as SaveIcon
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
  is_completed: number; // SQLiteの0/1に対応
  url?: string;
}

interface Reflection {
  id: number;
  event_id: number;
  user_id: number;
  revenue: number;
  expenses: number;
  profit: number;
  visitor_count: number;
  member_count: number;
  reflection_memo: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

const EventPlanningPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createEventDialog, setCreateEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [taskDialog, setTaskDialog] = useState(false);
  const [reflectionDialog, setReflectionDialog] = useState(false);
  const [reflections, setReflections] = useState<Reflection[]>([]);

  // 新規イベント作成フォーム
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    member_fee: '',
    visitor_fee: ''
  });

  // 振り返りメモフォーム
  const [reflectionForm, setReflectionForm] = useState({
    revenue: '',
    expenses: '',
    visitor_count: '',
    member_count: '',
    reflection_memo: ''
  });

  // デフォルトタスクテンプレート
  const defaultTasks = [
    { name: 'イベント企画書作成', deadline_days_before: 30, url: '' },
    { name: 'フライヤー作成→グループLINEで共有', deadline_days_before: 30, url: '' },
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

  // イベント一覧を取得
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/event-planning', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('企画イベント取得レスポンス:', response.data);
      setEvents(response.data);
    } catch (error) {
      console.error('企画イベント取得エラー:', error);
      setError('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // イベント作成
  const handleCreateEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/event-planning', newEvent, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('企画イベント作成レスポンス:', response.data);
      alert('イベントを作成しました！');
      setCreateEventDialog(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        start_time: '',
        end_time: '',
        location: '',
        member_fee: '',
        visitor_fee: ''
      });
      fetchEvents(); // 一覧を再取得
    } catch (error) {
      console.error('企画イベント作成エラー:', error);
      alert('イベントの作成に失敗しました');
    }
  };

  const handleTaskToggle = async (taskId: number, isCompleted: number) => {
    try {
      // 現在の完了状態を反転（0→1, 1→0）
      const newCompletedValue = isCompleted === 1 ? 0 : 1;
      
      console.log('タスク更新開始:', { taskId, isCompleted, newValue: newCompletedValue });
      
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/event-planning/tasks/${taskId}`, 
        { is_completed: newCompletedValue }, // 数値（0または1）を送信
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('タスク更新レスポンス:', response.data);
      
      // 選択されたイベントのタスクを更新
      if (selectedEvent) {
        const updatedTasks = selectedEvent.tasks?.map(task => 
          task.id === taskId ? { ...task, is_completed: newCompletedValue } : task
        ) || [];
        setSelectedEvent({ ...selectedEvent, tasks: updatedTasks });
        
        console.log('UIタスク更新完了:', { taskId, newCompletedValue });
      }
    } catch (error) {
      console.error('タスク更新エラー:', error);
      console.error('エラー詳細:', (error as any)?.response?.data);
      alert('タスクの更新に失敗しました');
    }
  };

  const openTaskDialog = async (event: Event) => {
    try {
      console.log('タスクダイアログを開く:', { eventId: event.id, eventTitle: event.title });
      
      // 企画管理APIから直接タスクを取得（既にイベントに含まれている）
      setSelectedEvent(event);
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

    // SQLiteの0/1をboolean判定に修正
    const isCompleted = Boolean(task.is_completed);

    if (isCompleted) {
      return { status: 'completed', color: 'success', icon: <CheckCircleIcon /> };
    } else if (diffDays < 0) {
      return { status: 'overdue', color: 'error', icon: <ErrorIcon /> };
    } else if (diffDays <= 3) {
      return { status: 'urgent', color: 'warning', icon: <WarningIcon /> };
    } else {
      return { status: 'pending', color: 'primary', icon: <ScheduleIcon /> };
    }
  };

  const getEventProgress = (event: Event) => {
    if (!event.tasks || event.tasks.length === 0) return 0;
    const completedTasks = event.tasks.filter(task => Boolean(task.is_completed)).length;
    return (completedTasks / event.tasks.length) * 100;
  };

  // 振り返りメモダイアログを開く
  const openReflectionDialog = async (event: Event) => {
    try {
      console.log('振り返りメモダイアログを開く:', { eventId: event.id, eventTitle: event.title });
      
      setSelectedEvent(event);
      
      // 振り返りメモを取得
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/event-planning/reflections/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('振り返りメモ取得レスポンス:', response.data);
      setReflections(response.data);
      
      setReflectionDialog(true);
      console.log('振り返りメモダイアログが開かれました');
    } catch (error) {
      console.error('振り返りメモ取得エラー:', error);
      alert('振り返りメモの取得に失敗しました');
    }
  };

  // 振り返りメモを保存
  const handleSaveReflection = async () => {
    try {
      if (!selectedEvent) return;
      
      console.log('振り返りメモ保存開始:', { eventId: selectedEvent.id, form: reflectionForm });
      
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/event-planning/reflections/${selectedEvent.id}`, reflectionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('振り返りメモ保存レスポンス:', response.data);
      
      // 振り返りメモを再取得
      const reflectionsResponse = await axios.get(`/api/event-planning/reflections/${selectedEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReflections(reflectionsResponse.data);
      
      // フォームをリセット
      setReflectionForm({
        revenue: '',
        expenses: '',
        visitor_count: '',
        member_count: '',
        reflection_memo: ''
      });
      
      alert('振り返りメモを保存しました！');
    } catch (error) {
      console.error('振り返りメモ保存エラー:', error);
      alert('振り返りメモの保存に失敗しました');
    }
  };

  // 利益を自動算出
  const calculateProfit = () => {
    const revenue = parseInt(reflectionForm.revenue) || 0;
    const expenses = parseInt(reflectionForm.expenses) || 0;
    return revenue - expenses;
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
                  const isCompleted = Boolean(task.is_completed);
                  
                  // 安全なカラー値の取得
                  const getBorderColor = () => {
                    switch (taskStatus.color) {
                      case 'success': return 'success.main';
                      case 'error': return 'error.main';
                      case 'warning': return 'warning.main';
                      case 'primary': return 'primary.main';
                      default: return 'grey.300';
                    }
                  };

                  const getButtonColor = () => {
                    switch (taskStatus.color) {
                      case 'success': return 'success';
                      case 'error': return 'error';
                      case 'warning': return 'warning';
                      case 'primary': return 'primary';
                      default: return 'primary';
                    }
                  };
                  
                  return (
                    <Box 
                      key={task.id}
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'stretch', sm: 'center' },
                        p: { xs: 2, sm: 3 }, 
                        mb: 2,
                        border: 1,
                        borderColor: getBorderColor(),
                        borderRadius: 2,
                        backgroundColor: isCompleted ? 'success.dark' : 
                                      taskStatus.status === 'overdue' ? 'error.light' :
                                      taskStatus.status === 'urgent' ? 'warning.light' : 'transparent',
                        opacity: isCompleted ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            fontWeight: isCompleted ? 'normal' : 500,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                            color: isCompleted ? 'white' : 'text.primary'
                          }}
                        >
                          {task.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1,
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            color: isCompleted ? 'white' : 'text.secondary'
                          }}
                        >
                          締切: {new Date(task.deadline_date).toLocaleDateString('ja-JP')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'row', sm: 'row' },
                        alignItems: 'center', 
                        gap: { xs: 1, sm: 2 },
                        mt: { xs: 2, sm: 0 },
                        ml: { xs: 0, sm: 2 },
                        justifyContent: { xs: 'flex-end', sm: 'flex-start' }
                      }}>
                        {task.url && task.name !== 'フライヤー作成→グループLINEで共有' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(task.url, '_blank');
                            }}
                            sx={{ 
                              minWidth: { xs: '60px', sm: '80px' },
                              fontSize: { xs: '0.7rem', sm: '0.8rem' }
                            }}
                          >
                            リンク
                          </Button>
                        )}
                        {task.name === 'イベント実施と反省メモ' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReflectionDialog(selectedEvent!);
                            }}
                            startIcon={<EditIcon />}
                            sx={{ 
                              minWidth: { xs: '80px', sm: '100px' },
                              fontSize: { xs: '0.7rem', sm: '0.8rem' }
                            }}
                          >
                            振り返り
                          </Button>
                        )}
                        <Button
                          variant={isCompleted ? "outlined" : "contained"}
                          color={isCompleted ? "success" : getButtonColor() as any}
                          onClick={() => handleTaskToggle(task.id, task.is_completed)}
                          startIcon={taskStatus.icon}
                          sx={{ 
                            minWidth: { xs: '80px', sm: '100px' },
                            fontSize: { xs: '0.7rem', sm: '0.8rem' },
                            whiteSpace: 'nowrap',
                            borderColor: isCompleted ? 'white' : undefined,
                            color: isCompleted ? 'white' : undefined,
                            backgroundColor: isCompleted ? 'transparent' : undefined,
                            '&:hover': {
                              borderColor: isCompleted ? 'success.light' : undefined,
                              color: isCompleted ? 'success.light' : undefined,
                              backgroundColor: isCompleted ? 'rgba(255,255,255,0.1)' : undefined
                            }
                          }}
                        >
                          {isCompleted ? '完了済み' : '完了'}
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

      {/* 振り返りメモダイアログ */}
      <Dialog open={reflectionDialog} onClose={() => setReflectionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEvent?.title} - 振り返りメモ
        </DialogTitle>
        <DialogContent>
          {selectedEvent ? (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                開催日: {new Date(selectedEvent.event_date).toLocaleDateString('ja-JP')} 
                {selectedEvent.start_time} - {selectedEvent.end_time}
              </Typography>

              {/* 振り返りメモフォーム */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>振り返りメモ入力</Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="売上 (円)"
                      type="number"
                      value={reflectionForm.revenue}
                      onChange={(e) => setReflectionForm({ ...reflectionForm, revenue: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="経費 (円)"
                      type="number"
                      value={reflectionForm.expenses}
                      onChange={(e) => setReflectionForm({ ...reflectionForm, expenses: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="利益 (円)"
                      type="number"
                      value={calculateProfit()}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 2 }}
                      color={calculateProfit() >= 0 ? 'success' : 'error'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ビジター数"
                      type="number"
                      value={reflectionForm.visitor_count}
                      onChange={(e) => setReflectionForm({ ...reflectionForm, visitor_count: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="メンバー数"
                      type="number"
                      value={reflectionForm.member_count}
                      onChange={(e) => setReflectionForm({ ...reflectionForm, member_count: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="振り返りメモ"
                      multiline
                      rows={4}
                      value={reflectionForm.reflection_memo}
                      onChange={(e) => setReflectionForm({ ...reflectionForm, reflection_memo: e.target.value })}
                      placeholder="イベントの振り返りや改善点を記入してください..."
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveReflection}
                  >
                    保存
                  </Button>
                </Box>
              </Paper>

              {/* 既存の振り返りメモ表示 */}
              {reflections.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>既存の振り返りメモ</Typography>
                  {reflections.map((reflection) => (
                    <Paper key={reflection.id} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                          {reflection.created_by_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(reflection.updated_at).toLocaleString('ja-JP')}
                        </Typography>
                      </Box>
                      
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={4}>
                          <Typography variant="body2">売上: ¥{reflection.revenue.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2">経費: ¥{reflection.expenses.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography 
                            variant="body2" 
                            color={reflection.profit >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            利益: ¥{reflection.profit.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">ビジター: {reflection.visitor_count}名</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">メンバー: {reflection.member_count}名</Typography>
                        </Grid>
                      </Grid>
                      
                      {reflection.reflection_memo && (
                        <Box>
                          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>振り返りメモ:</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {reflection.reflection_memo}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  ))}
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
          <Button onClick={() => setReflectionDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventPlanningPage; 