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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  
  // ECGレッスン予約用のstate
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationMessage, setReservationMessage] = useState('');

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

  const handleEcgLessonClick = (lesson: any) => {
    setSelectedLesson(lesson);
    setReservationDialogOpen(true);
  };

  const handleReservation = async () => {
    if (!selectedLesson || !user) return;
    
    setReservationLoading(true);
    setReservationMessage('');
    
    try {
      // GAS経由でメール送信
      const gasUrl = 'https://script.google.com/macros/s/AKfycbyruZZqWKzAiwYR1sCCgnOMKg6k2vBfKRqqhrl_EEDy7NiF1etRjNeD9I69siVdu_4/exec';
      
      const reservationData = {
        userName: user.username,
        userEmail: user.email,
        lessonTitle: selectedLesson.title,
        lessonDate: selectedLesson.event_date,
        lessonTime: `${selectedLesson.start_time} - ${selectedLesson.end_time}`,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
        mode: 'no-cors' // GASの制限により必要
      });
      
      setReservationMessage('営業日予約完了です！確認メールを送信しました。');
      setTimeout(() => {
        setReservationDialogOpen(false);
        setReservationMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('予約エラー:', error);
      setReservationMessage('営業日予約の送信に失敗しました。もう一度お試しください。');
    } finally {
      setReservationLoading(false);
    }
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

  const getPastEvents = () => {
    // ローカルタイムゾーンで今日の日付文字列を作成
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    return events
      .filter(event => event.event_date < todayStr)
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()); // 新しい順
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 4,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700,
          fontSize: { xs: '1.75rem', sm: '2.125rem', md: '3rem' }
        }}>
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
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        px: { xs: 1, sm: 0 }
      }}>
        <IconButton 
          onClick={handlePreviousMonth}
          sx={{ 
            color: 'text.secondary',
            p: { xs: 1, sm: 1.5 }
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" sx={{ 
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
          textAlign: 'center',
          flex: 1
        }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Typography>
        <IconButton 
          onClick={handleNextMonth}
          sx={{ 
            color: 'text.secondary',
            p: { xs: 1, sm: 1.5 }
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* カレンダー */}
      <Card elevation={0} sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* 曜日ヘッダー */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: { xs: 0.5, sm: 1 }, 
            mb: 1 
          }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <Box key={day} sx={{ 
                textAlign: 'center', 
                py: { xs: 1, sm: 2 }, 
                fontWeight: 600, 
                color: 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.9rem' }
              }}>
                {day}
              </Box>
            ))}
          </Box>

          {/* カレンダーグリッド */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: { xs: 0.5, sm: 1 },
            minHeight: { xs: 'auto', sm: 400 }
          }}>
            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              
              // ビジター専用: 平日のECG営業日と土曜日のJCG営業日を追加
              const isVisitor = user?.role === 'ビジター';
              const weekdayLessons = [];
              
              if (isVisitor && day) {
                const dayOfWeek = day.getDay(); // 0:日曜, 1:月曜, 2:火曜, 3:水曜, 4:木曜, 5:金曜, 6:土曜
                
                // 月水金のECG営業日
                if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) { // 月水金
                  weekdayLessons.push({
                    id: day.getTime(),
                    title: 'ECG 神戸三宮',
                    description: 'ECG営業日',
                    target_audience: 'ビジター',
                    start_time: '18:00',
                    end_time: '21:00',
                    participation_method: '現地参加',
                    created_by: 0,
                    created_by_name: 'ECG English',
                    created_by_role: 'ECG講師',
                    cover_image: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    isEcgLesson: true,
                    event_date: day.toISOString().split('T')[0]
                  });
                }
                
                // 土曜日のJCG営業日
                if (dayOfWeek === 6) { // 土曜日
                  weekdayLessons.push({
                    id: day.getTime() + 1, // 同じ日の場合はIDを分ける
                    title: 'JCG 神戸三宮',
                    description: 'JCG営業日',
                    target_audience: 'ビジター',
                    start_time: '18:00',
                    end_time: '21:00',
                    participation_method: '現地参加',
                    created_by: 0,
                    created_by_name: 'JCG Japanese',
                    created_by_role: 'JCG講師',
                    cover_image: '',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    isEcgLesson: true, // 同じフラグを使用（営業日予約として）
                    event_date: day.toISOString().split('T')[0]
                  });
                }
              }
              
              const allDayEvents = [...dayEvents, ...weekdayLessons];
              const isSelected = day && selectedDate && 
                day.getDate() === selectedDate.getDate() && 
                day.getMonth() === selectedDate.getMonth() && 
                day.getFullYear() === selectedDate.getFullYear();
              
              return (
                <Box
                  key={index}
                  sx={{
                    minHeight: { xs: 60, sm: 80, md: 100 },
                    border: '1px solid',
                    borderColor: 'divider',
                    p: { xs: 0.5, sm: 1 },
                    cursor: canEdit ? 'pointer' : 'default',
                    backgroundColor: isSelected ? '#1976d2' : 
                      (allDayEvents.length > 0 ? 'rgba(25, 118, 210, 0.05)' : 'transparent'),
                    color: isSelected ? 'white' : 'text.primary',
                    '&:hover': canEdit ? {
                                              backgroundColor: isSelected ? '#1976d2' : 
                        (allDayEvents.length > 0 ? 'rgba(25, 118, 210, 0.1)' : '#f5f5f5'),
                    } : {},
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
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
                        mb: { xs: 0.5, sm: 1 },
                        color: 'inherit',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {day.getDate()}
                    </Typography>
                  )}
                  
                  {/* イベント表示エリア */}
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                  }}>
                    {/* スマホ・タブレット版: イベントがある場合のみドットを表示 */}
                    {allDayEvents.length > 0 && (
                      <Box sx={{
                        display: { xs: 'flex', lg: 'none' },
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'white' : '#1976d2',
                          opacity: 0.8
                        }} />
                        {allDayEvents.length > 1 && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.5rem',
                              color: 'inherit',
                              opacity: 0.7,
                              fontWeight: 500
                            }}
                          >
                            {allDayEvents.length}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {/* デスクトップ版: 従来の表示 */}
                    <Box sx={{ 
                      display: { xs: 'none', lg: 'flex' },
                      flexDirection: 'column',
                      gap: { xs: 0.25, sm: 0.5 },
                      overflow: 'hidden',
                      width: '100%'
                    }}>
                      {allDayEvents.slice(0, 3).map((event, eventIndex) => (
                        <Box key={event.id} sx={{ 
                          mb: { xs: 0.25, sm: 0.5 },
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                          borderRadius: 0.5,
                          p: { xs: 0.25, sm: 0.5 },
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                          }
                        }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              color: 'inherit',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontWeight: 500,
                              lineHeight: 1.2,
                            }}
                            onClick={(e) => {
                              if ((event as any).isEcgLesson) {
                                e.stopPropagation();
                                handleEcgLessonClick(event as any);
                              } else {
                                handleEventClick(event, e);
                              }
                            }}
                          >
                            {event.title}
                            {(event as any).isEcgLesson && (
                              <span style={{ color: '#ff9800', fontSize: '0.5rem', marginLeft: '4px' }}>
                                [営業日予約]
                              </span>
                            )}
                          </Typography>
                          {event.start_time && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: { xs: '0.5rem', sm: '0.6rem' },
                                color: 'inherit',
                                opacity: 0.8,
                                cursor: 'pointer',
                                display: 'block',
                                lineHeight: 1.1,
                              }}
                              onClick={(e) => {
                                if ((event as any).isEcgLesson) {
                                  e.stopPropagation();
                                  handleEcgLessonClick(event as any);
                                } else {
                                  handleEventClick(event, e);
                                }
                              }}
                            >
                              {formatTime(event.start_time)}
                            </Typography>
                          )}
                        </Box>
                      ))}
                      
                      {/* 追加イベントがある場合の表示 */}
                      {allDayEvents.length > 3 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            color: 'inherit',
                            opacity: 0.7,
                            fontStyle: 'italic',
                            textAlign: 'center',
                            mt: 'auto'
                          }}
                        >
                          +{allDayEvents.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* 選択された日付のイベント */}
      {selectedDate && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              mb: 2,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
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
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 600, 
            mb: 3,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
            {t('upcomingEvents')}
          </Typography>
          
          {getUpcomingEvents().length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              {t('noUpcomingEvents')}
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

      {/* 過去のイベント一覧 */}
      {getPastEvents().length > 0 && (
        <Card elevation={0} sx={{ borderRadius: 3, mt: 4 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600, 
              mb: 3,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              {t('pastEvents')}
            </Typography>
            
            <Box>
              {getPastEvents().map((event) => (
                <Box key={event.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, opacity: 0.7 }}>
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
          </CardContent>
        </Card>
      )}

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

      {/* ECG営業日予約ダイアログ */}
      <Dialog
        open={reservationDialogOpen}
        onClose={() => setReservationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ECG営業日予約
        </DialogTitle>
        <DialogContent>
          {selectedLesson && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedLesson.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                日時: {new Date(selectedLesson.event_date).toLocaleDateString('ja-JP')} {selectedLesson.start_time} - {selectedLesson.end_time}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                場所: 神戸三宮
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <a 
                  href="https://maps.app.goo.gl/gHTXyhjhds27a75q7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'none' }}
                >
                  📍 地図を開く
                </a>
              </Typography>
              
              {reservationMessage && (
                <Alert 
                  severity={reservationMessage.includes('完了') ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  {reservationMessage}
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary">
                営業日予約完了後、確認メールをお送りします。
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReservationDialogOpen(false)}
            disabled={reservationLoading}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleReservation}
            variant="contained"
            disabled={reservationLoading || reservationMessage.includes('完了')}
            startIcon={reservationLoading ? <CircularProgress size={20} /> : null}
          >
            {reservationLoading ? '予約中...' : '営業日予約する'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventsPage; 