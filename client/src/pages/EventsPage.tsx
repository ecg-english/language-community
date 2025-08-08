import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Info as InfoIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Event {
  id: number;
  title: string;
  description: string;
  target_audience: string;
  event_date: string;
  start_time: string;
  end_time: string;
  participation_method: string;
  created_by: number;
  created_by_name: string;
  created_by_role: string;
  created_at: string;
  updated_at: string;
}

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_audience: '',
    event_date: '',
    start_time: '',
    end_time: '',
    participation_method: '',
  });

  const canEdit = ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(user?.role || '');

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      
      const response = await axios.get(`/api/events/month/${year}/${month}`);
      setEvents(response.data.events);
    } catch (error: any) {
      console.error('イベント取得エラー:', error);
      setError('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (canEdit) {
      setFormData(prev => ({
        ...prev,
        event_date: date.toISOString().split('T')[0]
      }));
      setSelectedEvent(null);
      setIsEditing(false);
      setDialogOpen(true);
    }
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      target_audience: '',
      event_date: '',
      start_time: '',
      end_time: '',
      participation_method: '',
    });
    setDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setFormData({
      title: event.title,
      description: event.description,
      target_audience: event.target_audience,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      participation_method: event.participation_method,
    });
    setDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('このイベントを削除しますか？')) return;

    try {
      await axios.delete(`/api/events/${eventId}`);
      await loadEvents();
    } catch (error: any) {
      console.error('イベント削除エラー:', error);
      setError('イベントの削除に失敗しました');
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedEvent) {
        await axios.put(`/api/events/${selectedEvent.id}`, formData);
      } else {
        await axios.post('/api/events', formData);
      }
      
      setDialogOpen(false);
      await loadEvents();
    } catch (error: any) {
      console.error('イベント保存エラー:', error);
      setError('イベントの保存に失敗しました');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    // ローカルタイムゾーンで日付文字列を作成
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return events.filter(event => event.event_date === dateStr);
  };

  const getUpcomingEvents = () => {
    // ローカルタイムゾーンで今日の日付文字列を作成
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    return events
      .filter(event => event.event_date >= todayStr)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 10); // 最大10件表示
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM形式
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime) return '';
    if (!endTime) return formatTime(startTime);
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          Events
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEvent}
            sx={{
              background: '#1976d2',
              color: 'white',
              borderRadius: 2,
              px: 3,
              py: 1,
              '&:hover': {
                background: '#1565c0',
              },
            }}
          >
            Add Event
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* カレンダーナビゲーション */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={handlePreviousMonth}
          sx={{ color: 'text.secondary' }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Typography>
        <IconButton 
          onClick={handleNextMonth}
          sx={{ color: 'text.secondary' }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* カレンダー */}
      <Card elevation={0} sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          {/* 曜日ヘッダー */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <Box key={day} sx={{ 
                textAlign: 'center', 
                py: 2, 
                fontWeight: 600, 
                color: 'text.secondary',
                fontSize: '0.9rem'
              }}>
                {day}
              </Box>
            ))}
          </Box>

          {/* カレンダーグリッド */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {days.map((day, index) => (
              <Box
                key={index}
                sx={{
                  minHeight: 80,
                  border: '1px solid',
                borderColor: 'divider',
                  p: 1,
                  cursor: canEdit ? 'pointer' : 'default',
                  backgroundColor: day && selectedDate && 
                    day.getDate() === selectedDate.getDate() && 
                    day.getMonth() === selectedDate.getMonth() && 
                    day.getFullYear() === selectedDate.getFullYear() 
                      ? '#1976d2' 
                      : 'transparent',
                  color: day && selectedDate && 
                    day.getDate() === selectedDate.getDate() && 
                    day.getMonth() === selectedDate.getMonth() && 
                    day.getFullYear() === selectedDate.getFullYear() 
                      ? 'white' 
                      : 'text.primary',
                  '&:hover': canEdit ? {
                    backgroundColor: day && selectedDate && 
                      day.getDate() === selectedDate.getDate() && 
                      day.getMonth() === selectedDate.getMonth() && 
                      day.getFullYear() === selectedDate.getFullYear() 
                        ? '#1976d2' 
                        : '#f5f5f5',
                  } : {},
                  borderRadius: 1,
                }}
                onClick={() => {
                  if (day) {
                    handleDateClick(day);
                  }
                }}
              >
                {day && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      mb: 1,
                      color: 'inherit'
                    }}
                  >
                    {day.getDate()}
                  </Typography>
                )}
                {day && getEventsForDate(day).map((event) => (
                  <Box key={event.id} sx={{ mb: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.7rem',
                        color: 'inherit',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      {event.title}
                    </Typography>
                    {event.start_time && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.6rem',
                          color: 'inherit',
                          opacity: 0.8,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          }
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        {formatTime(event.start_time)}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 選択された日付のイベント */}
      {selectedDate && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}
            </Typography>
            
            {selectedDateEvents.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                There are no events on this day
              </Typography>
            ) : (
              <Box>
                {selectedDateEvents.map((event) => (
                  <Box key={event.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'underline',
                          }
                        }}
                        onClick={() => handleEventClick(event, {} as React.MouseEvent)}
                      >
                        {event.title}
                      </Typography>
                      {canEdit && (
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditEvent(event)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteEvent(event.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    
                    {event.start_time && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {formatTimeRange(event.start_time, event.end_time)}
                      </Typography>
                    )}
                    
                    {event.description && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {event.description}
                      </Typography>
                    )}
                    
                    {event.target_audience && (
                      <Typography variant="body2" color="text.secondary">
                        Target: {event.target_audience}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* 今後のイベント一覧 */}
              <Card elevation={0} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Upcoming Events
          </Typography>
          
          {getUpcomingEvents().length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No upcoming events
            </Typography>
          ) : (
            <Box>
              {getUpcomingEvents().map((event) => (
                <Box key={event.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                      onClick={() => handleEventClick(event, {} as React.MouseEvent)}
                    >
                      {event.title}
                    </Typography>
                    {canEdit && (
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditEvent(event)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteEvent(event.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {new Date(event.event_date).toLocaleDateString('en-US')} • {formatTimeRange(event.start_time, event.end_time)}
                  </Typography>
                  
                  {event.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>
                  )}
                  
                  {event.target_audience && (
                    <Typography variant="body2" color="text.secondary">
                      Target: {event.target_audience}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* イベント詳細・編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Event' : selectedEvent ? 'Event Details' : 'Add Event'}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && !isEditing ? (
            // 詳細表示
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedEvent.title}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedEvent.event_date).toLocaleDateString('en-US')} • {formatTimeRange(selectedEvent.start_time, selectedEvent.end_time)}
                </Typography>
              </Box>

              {selectedEvent.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.description}
                  </Typography>
                </Box>
              )}

              {selectedEvent.target_audience && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Target Audience
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.target_audience}
                  </Typography>
                </Box>
              )}

              {selectedEvent.participation_method && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Participation Method
                  </Typography>
                  <Typography variant="body1">
                    {selectedEvent.participation_method}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Created by: {selectedEvent.created_by_name} ({selectedEvent.created_by_role})
              </Typography>
            </Box>
          ) : (
            // 編集フォーム
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Target Audience"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  {/* 空のスペース */}
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="Participation Method"
                value={formData.participation_method}
                onChange={(e) => setFormData({ ...formData, participation_method: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEvent && !isEditing && canEdit && (
            <>
              <Button onClick={() => handleEditEvent(selectedEvent)} color="primary">
                Edit
              </Button>
              <Button onClick={() => handleDeleteEvent(selectedEvent.id)} color="error">
                Delete
              </Button>
            </>
          )}
          {(!selectedEvent || isEditing) && (
            <>
              <Button onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="contained">
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </>
          )}
          {selectedEvent && !isEditing && (
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventsPage; 