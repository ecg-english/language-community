import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Logout as LogoutIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'サーバー管理者':
        return '#dc2626';
      case 'ECG講師':
      case 'JCG講師':
        return '#ea580c';
      case 'Class1 Members':
        return '#7c3aed';
      case 'ECGメンバー':
      case 'JCGメンバー':
        return '#2563eb';
      case 'Trial参加者':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const menuItems = [
    {
      text: t('profile'),
      icon: <AccountCircleIcon />,
      onClick: () => handleNavigation(`/profile/${user?.id}`),
    },
    {
      text: t('memberList'),
      icon: <PeopleIcon />,
      onClick: () => handleNavigation('/members'),
    },
    {
      text: t('features'),
      icon: <InfoIcon />,
      onClick: () => handleNavigation('/features'),
    },
    {
      text: t('events'),
      icon: <EventIcon />,
      onClick: () => handleNavigation('/events'),
    },
    {
      text: t('monthlyHistory'),
      icon: <HistoryIcon />,
      onClick: () => handleNavigation('/monthly-history'),
    },
  ];

  // 管理者の場合、管理者パネルを追加
  if (user?.role === 'サーバー管理者') {
    menuItems.push({
      text: t('adminPanel'),
      icon: <AdminPanelSettingsIcon />,
      onClick: () => handleNavigation('/admin'),
    });
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* ヘッダー部分 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {t('languageLearningCommunity')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* ユーザー情報 */}
        {user && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                src={user.avatar_url && !user.avatar_url.includes('https://language-community-backend.onrender.comhttps') ? user.avatar_url : undefined}
                sx={{
                  width: 48,
                  height: 48,
                  mr: 2,
                  fontWeight: 600,
                  fontSize: '1.25rem',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {user.username}
                </Typography>
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    backgroundColor: getRoleColor(user.role),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 20,
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* ナビゲーションメニュー */}
        <List sx={{ p: 0 }}>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={item.onClick}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(30, 64, 175, 0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.875rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* ログアウトボタン */}
        <List sx={{ p: 0 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'rgba(220, 38, 38, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#dc2626' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('logout')}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: '#dc2626',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 