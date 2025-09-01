import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface EventPostProps {
  event: {
    id: number;
    title: string;
    description: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location: string;
    cover_image?: string;
    created_by_name: string;
    created_by_role: string;
    created_at: string;
  };
  onEdit?: (event: any) => void;
  onDelete?: (eventId: number) => void;
  canEdit?: boolean;
}

const EventPost: React.FC<EventPostProps> = ({ 
  event, 
  onEdit, 
  onDelete, 
  canEdit = false
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const day = days[date.getDay()];
      const month = months[date.getMonth()];
      const dayOfMonth = date.getDate();
      
      return `${day}, ${month} ${dayOfMonth}`;
    } catch (error) {
      return '';
    }
  };

  const formatTime = (time: string) => {
    if (!time || typeof time !== 'string') return '';
    return time.substring(0, 5);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || typeof startTime !== 'string') return '';
    if (!endTime || typeof endTime !== 'string') return formatTime(startTime);
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleEventClick = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <Card 
      elevation={0}
      sx={{
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }}
      onClick={handleEventClick}
    >
      <CardContent sx={{ p: 0 }}>
        {/* カバー画像 */}
        <Box
          sx={{
            height: 200,
            backgroundImage: (() => {
              const coverImage = event.cover_image;
              
              // デバッグログ：cover_imageの値を詳細に確認
              console.log('EventPost cover_image詳細:', {
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
            borderRadius: '12px 12px 0 0',
          }}
        >
          {/* オーバーレイ */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Typography
              variant="h4"
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

        {/* イベント詳細 */}
        <Box sx={{ p: 3 }}>
          {/* ヘッダー */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {event.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(event.event_date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatTimeRange(event.start_time, event.end_time)} JST
                </Typography>
              </Box>
              {event.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {event.location}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {canEdit && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  // メニュー表示ロジック
                }}
              >
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          {/* 作成者情報 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
              {event.created_by_name ? event.created_by_name.charAt(0) : '?'}
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {event.created_by_name || 'Unknown'} ({event.created_by_role || 'Unknown'})
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventPost; 