import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import EventEditForm from '../components/EventEditForm/EventEditForm';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  cover_image?: string;
  created_by: number;
  created_by_name: string;
  created_by_role: string;
  created_at: string;
  updated_at: string;
}

interface Attendee {
  id: number;
  user_id: number;
  event_id: number;
  username: string;
  role: string;
  avatar_url?: string;
  created_at: string;
}

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
    }
  }, [eventId]);

  const handleEdit = () => {
    setEditFormOpen(true);
  };

  const handleEditSuccess = () => {
    console.log('イベント編集成功:', { eventId });
    loadEventDetails(); // イベント詳細を再読み込み
    
    // カスタムイベントを発火して、チャンネルページに編集完了を通知
    window.dispatchEvent(new CustomEvent('eventEditSuccess', {
      detail: { eventId: eventId }
    }));
    console.log('イベント編集成功イベントを発火');
  };

  const handleDelete = async () => {
    if (!event || !window.confirm('このイベントを削除しますか？')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.delete(`/api/events/${eventId}`);
      navigate('/events');
    } catch (error: any) {
      console.error('イベント削除エラー:', error);
      alert('イベントの削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== EventDetailPage: イベント詳細取得開始 ===', { eventId });

      const [eventResponse, attendeesResponse] = await Promise.all([
        axios.get(`/api/events/${eventId}`),
        axios.get(`/api/events/${eventId}/attendees`)
      ]);

      console.log('=== EventDetailPage: レスポンス取得 ===');
      console.log('eventResponse.data:', eventResponse.data);
      console.log('attendeesResponse.data:', attendeesResponse.data);

      // サーバーは直接イベントオブジェクトを返す（eventプロパティなし）
      const eventData = eventResponse.data;
      const attendeesData = eventData.attendees || attendeesResponse.data || [];

      console.log('=== EventDetailPage: データ設定 ===');
      console.log('eventData:', eventData);
      console.log('attendeesData:', attendeesData);

      setEvent(eventData);
      setAttendees(attendeesData);
      
      // 現在のユーザーが参加しているかチェック
      const userAttending = attendeesData.some(
        (attendee: Attendee) => attendee.user_id === user?.id
      );
      setIsAttending(userAttending);

      console.log('=== EventDetailPage: 設定完了 ===');
      console.log('isAttending:', userAttending);
    } catch (error: any) {
      console.error('=== EventDetailPage: エラー発生 ===', error);
      console.error('エラー詳細:', error.response?.data);
      setError('イベントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAttend = async () => {
    if (!user || !event) return;

    try {
      setIsSubmitting(true);
      
      if (isAttending) {
        // 参加をキャンセル
        await axios.delete(`/api/events/${eventId}/attend`);
        setAttendees(prev => prev.filter(a => a.user_id !== user.id));
        setIsAttending(false);
      } else {
        // 参加する
        await axios.post(`/api/events/${eventId}/attend`);
        const newAttendee: Attendee = {
          id: Date.now(), // 仮のID
          user_id: user.id,
          event_id: parseInt(eventId!),
          username: user.username,
          role: user.role,
          avatar_url: user.avatar_url,
          created_at: new Date().toISOString()
        };
        setAttendees(prev => [...prev, newAttendee]);
        setIsAttending(true);
      }
    } catch (error: any) {
      console.error('参加処理エラー:', error);
      setError('参加処理に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();
    
    return `${day}, ${month} ${dayOfMonth}, ${year}`;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime) return '';
    if (!endTime) return formatTime(startTime);
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const canEdit = user && (user.id === event?.created_by || user.role === 'サーバー管理者');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'イベントが見つかりません'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          戻る
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* イベント編集フォーム */}
      {event && (
        <EventEditForm
          open={editFormOpen}
          onClose={() => setEditFormOpen(false)}
          event={event}
          onSuccess={handleEditSuccess}
        />
      )}
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          {event.title}
        </Typography>
        {canEdit && (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <IconButton onClick={handleEdit} disabled={isSubmitting}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDelete} color="error" disabled={isSubmitting}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* メインコンテンツ */}
        <Grid item xs={12} md={8}>
          {/* カバー画像 */}
          <Card elevation={0} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                height: 300,
                backgroundImage: (() => {
                  const coverImage = event.cover_image;
                  
                  // デバッグログ：cover_imageの値を詳細に確認
                  console.log('EventDetailPage cover_image詳細:', {
                    eventId: event.id,
                    title: event.title,
                    cover_image: coverImage,
                    cover_image_type: typeof coverImage,
                    startsWith_http: coverImage?.startsWith('http'),
                    startsWith_https: coverImage?.startsWith('https'),
                    startsWith_data: coverImage?.startsWith('data:'),
                    startsWith_uploads: coverImage?.startsWith('/uploads'),
                    length: coverImage?.length
                  });
                  
                  if (!coverImage) {
                    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                  }
                  
                  // /uploads/data: で始まる場合は、/uploads/プレフィックスを除去
                  if (coverImage.startsWith('/uploads/data:')) {
                    const corrected = coverImage.replace('/uploads/', '');
                    console.log('🔧 /uploads/プレフィックスを除去:', corrected.substring(0, 50) + '...');
                    return `url(${corrected})`;
                  }
                  
                  // base64画像データの場合はそのまま使用
                  if (coverImage.startsWith('data:')) {
                    console.log('base64画像を使用:', coverImage.substring(0, 50) + '...');
                    return `url(${coverImage})`;
                  }
                  
                  // 既に完全なURL（http/httpsで始まる）の場合はそのまま使用
                  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
                    console.log('完全なURLを使用:', coverImage);
                    return `url(${coverImage})`;
                  }
                  
                  // 相対パスの場合はベースURLを付与
                  console.log('相対パスにベースURLを付与:', coverImage);
                  return `url(https://language-community-backend.onrender.com${coverImage})`;
                })(),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    textAlign: 'center',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                    px: 2,
                  }}
                >
                  {event.title}
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* イベント詳細 */}
          <Card elevation={0} sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                {t('eventDetails')}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {event.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* 日時・場所情報 */}
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EventIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {formatDate(event.event_date)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTimeRange(event.start_time, event.end_time)} JST
                    </Typography>
                  </Box>
                </Box>

                {event.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationIcon color="primary" />
                    <Typography variant="body1">
                      {event.location}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* サイドバー */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* 日時カード */}
            <Card elevation={0} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {new Date(event.event_date).getDate()}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {formatDate(event.event_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTimeRange(event.start_time, event.end_time)} JST
                </Typography>
              </CardContent>
            </Card>

            {/* 参加ボタン */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleAttend}
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                backgroundColor: isAttending ? 'error.main' : 'primary.main',
                '&:hover': {
                  backgroundColor: isAttending ? 'error.dark' : 'primary.dark',
                },
              }}
            >
              {isSubmitting ? t('loading') : isAttending ? t('cancelAttendance') : t('attend')}
            </Button>

            {/* 参加者リスト */}
            <Card elevation={0} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {attendees.length} {t('attendees')}
                  </Typography>
                </Box>
                
                <Stack spacing={1}>
                  {attendees.slice(0, 5).map((attendee) => (
                    <Box key={attendee.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ width: 32, height: 32 }}
                        src={attendee.avatar_url && !attendee.avatar_url.includes('https://language-community-backend.onrender.comhttps') ? attendee.avatar_url : undefined}
                      >
                        {attendee.username.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {attendee.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attendee.role}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  
                  {attendees.length > 5 && (
                    <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                      他 {attendees.length - 5} 人を表示
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EventDetailPage; 