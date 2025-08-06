import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

interface Category {
  id: number;
  name: string;
  is_collapsed: boolean;
  channels: Channel[];
}

interface Channel {
  id: number;
  name: string;
  channel_type: string;
  description: string;
}

interface ChannelSidebarProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  currentChannelId?: number;
}

const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  open,
  onClose,
  categories,
  currentChannelId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedCategories, setExpandedCategories] = React.useState<{ [key: number]: boolean }>({});

  // カテゴリの展開状態を初期化
  React.useEffect(() => {
    const initialExpanded: { [key: number]: boolean } = {};
    categories.forEach(category => {
      initialExpanded[category.id] = !category.is_collapsed;
    });
    setExpandedCategories(initialExpanded);
  }, [categories]);

  const handleCategoryToggle = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleChannelClick = (channelId: number) => {
    navigate(`/channels/${channelId}`);
    onClose();
  };

  const handleHomeClick = () => {
    navigate('/community');
    onClose();
  };

  const getChannelTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_only_instructors_view':
        return t('channelTypeStaffOnly');
      case 'admin_only_all_view':
        return t('channelTypeAnnouncement');
      case 'instructors_post_all_view':
        return t('channelTypeInstructorPost');
      case 'all_post_all_view':
        return t('channelTypeGeneralPost');
      case 'class1_post_class1_view':
        return t('channelTypeClass1Only');
      default:
        return type;
    }
  };

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'admin_only_instructors_view':
        return 'error';
      case 'admin_only_all_view':
        return 'warning';
      case 'instructors_post_all_view':
        return 'info';
      case 'all_post_all_view':
        return 'success';
      case 'class1_post_class1_view':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const checkChannelViewPermission = (channelType: string, userRole: string): boolean => {
    switch (channelType) {
      case 'admin_only_instructors_view':
        return ['サーバー管理者', 'ECG講師', 'JCG講師'].includes(userRole);
      case 'class1_post_class1_view':
        return ['サーバー管理者', 'ECG講師', 'JCG講師', 'Class1 Members'].includes(userRole);
      case 'admin_only_all_view':
      case 'instructors_post_all_view':
      case 'all_post_all_view':
        return true;
      default:
        return false;
    }
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('channels')}
        </Typography>
        
        {/* ホームボタン */}
        <ListItem
          button
          onClick={handleHomeClick}
          sx={{
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              backgroundColor: 'primary.light',
            },
          }}
        >
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary={t('community')} />
        </ListItem>

        <Divider sx={{ my: 2 }} />

        {/* カテゴリとチャンネル */}
        {categories.map((category) => (
          <Box key={category.id} sx={{ mb: 1 }}>
            <ListItem
              button
              onClick={() => handleCategoryToggle(category.id)}
              sx={{
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              <ListItemText 
                primary={category.name}
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
              {expandedCategories[category.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>

            <Collapse in={expandedCategories[category.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {category.channels
                  .filter(channel => checkChannelViewPermission(channel.channel_type, user?.role || ''))
                  .map((channel) => (
                    <ListItem
                      key={channel.id}
                      button
                      onClick={() => handleChannelClick(channel.id)}
                      sx={{
                        pl: 4,
                        borderRadius: 1,
                        mx: 1,
                        mb: 0.5,
                        backgroundColor: currentChannelId === channel.id ? 'primary.light' : 'transparent',
                        '&:hover': {
                          backgroundColor: currentChannelId === channel.id ? 'primary.light' : 'grey.50',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ChatIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: currentChannelId === channel.id ? 600 : 400,
                              }}
                            >
                              {channel.name}
                            </Typography>
                            <Chip
                              label={getChannelTypeLabel(channel.channel_type)}
                              color={getChannelTypeColor(channel.channel_type) as any}
                              size="small"
                              sx={{ fontSize: '0.6rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          channel.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {channel.description}
                            </Typography>
                          )
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
};

export default ChannelSidebar; 