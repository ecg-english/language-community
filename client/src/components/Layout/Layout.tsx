import React, { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Chip,
  Container,
  Menu,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Logout as LogoutIcon,
  Language as LanguageIcon,
  History as HistoryIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMonthlyNotification } from '../../hooks/useMonthlyNotification';
import MonthlyUpdateDialog from '../MonthlyUpdateDialog';
import ChannelSidebar from '../ChannelSidebar/ChannelSidebar';
import { useCommunity } from '../../contexts/CommunityContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { currentLanguage, changeLanguage, getLanguageLabel } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { notification, refetch } = useMonthlyNotification();
  const [monthlyDialogOpen, setMonthlyDialogOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { categories, channels } = useCommunity();

  // ChannelSidebar用のデータ形式に変換
  const sidebarCategories = React.useMemo(() => {
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      is_collapsed: category.is_collapsed,
      channels: channels[category.id] || []
    }));
  }, [categories, channels]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleAdminPanel = () => {
    navigate('/admin');
    handleClose();
  };

  const handleProfile = () => {
    navigate(`/profile/${user?.id}`);
    handleClose();
  };

  const handleMemberList = () => {
    navigate('/members');
    handleClose();
  };

  const handleLanguageChange = (event: any) => {
    changeLanguage(event.target.value);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  // 月次通知の表示
  React.useEffect(() => {
    if (notification?.shouldNotify) {
      setMonthlyDialogOpen(true);
    }
  }, [notification]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'サーバー管理者':
        return 'error';
      case 'ECG講師':
      case 'JCG講師':
        return 'warning';
      case 'Class1 Members':
        return 'secondary';
      case 'ECGメンバー':
      case 'JCGメンバー':
        return 'info';
      case 'Trial参加者':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleGradient = (role: string) => {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              {/* ハンバーガーメニューボタン */}
              <IconButton
                onClick={handleSidebarToggle}
                sx={{
                  mr: 2,
                  p: { xs: 1, sm: 1.5 },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
              
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  display: { xs: 'none', sm: 'block' },
                }}
                onClick={() => navigate('/community')}
              >
                {t('languageLearningCommunity')}
              </Typography>
            </Box>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                {/* テーマ切り替えボタン */}
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>

                {/* 言語選択 */}
                <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 120 } }}>
                  <Select
                    value={currentLanguage}
                    onChange={handleLanguageChange}
                    displayEmpty
                    sx={{
                      '& .MuiSelect-select': {
                        py: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      },
                    }}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ja">日本語</MenuItem>
                    <MenuItem value="jaSimple">かんたんな、にほんご</MenuItem>
                  </Select>
                </FormControl>

                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    backgroundColor: getRoleGradient(user.role),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    height: { xs: 24, sm: 28 },
                    display: { xs: 'none', sm: 'flex' },
                  }}
                />
                <IconButton
                  onClick={handleMenu}
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <Avatar
                    src={user.avatar_url && !user.avatar_url.includes('https://language-community-backend.onrender.comhttps') ? user.avatar_url : undefined}
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      fontWeight: 600,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* ユーザーメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={handleProfile}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(30, 64, 175, 0.04)',
            },
          }}
        >
          <AccountCircleIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={500}>
            {t('profile')}
          </Typography>
        </MenuItem>

        {user?.role !== 'ビジター' && (
          <MenuItem
            onClick={handleMemberList}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(30, 64, 175, 0.04)',
              },
            }}
          >
            <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={500}>
              {t('memberList')}
            </Typography>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => navigate('/features')}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(30, 64, 175, 0.04)',
            },
          }}
        >
          <InfoIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={500}>
            {t('features')}
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => navigate('/events')}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(30, 64, 175, 0.04)',
            },
          }}
        >
          <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={500}>
            {t('events')}
          </Typography>
        </MenuItem>

        {user?.role !== 'ビジター' && (
          <MenuItem
            onClick={() => navigate('/monthly-history')}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(30, 64, 175, 0.04)',
              },
            }}
          >
            <HistoryIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={500}>
              {t('monthlyHistory')}
            </Typography>
          </MenuItem>
        )}

        {user?.role === 'サーバー管理者' && (
          <MenuItem
            onClick={handleAdminPanel}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(30, 64, 175, 0.04)',
              },
            }}
          >
            <AdminPanelSettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight={500}>
              {t('adminPanel')}
            </Typography>
          </MenuItem>
        )}

        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(220, 38, 38, 0.04)',
            },
          }}
        >
          <LogoutIcon sx={{ mr: 2, color: '#dc2626' }} />
          <Typography variant="body2" fontWeight={500} color="#dc2626">
            {t('logout')}
          </Typography>
        </MenuItem>
      </Menu>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 80px)',
          pt: '80px', // AppBarの高さを考慮してメインコンテンツにパディングを追加
        }}
      >
        {children}
      </Box>

      {/* チャンネルサイドバー */}
      <ChannelSidebar 
        open={sidebarOpen} 
        onClose={handleSidebarClose}
        categories={sidebarCategories}
      />
      
      {/* 月次通知ダイアログ */}
      <MonthlyUpdateDialog
        open={monthlyDialogOpen}
        onClose={() => setMonthlyDialogOpen(false)}
        onSuccess={() => {
          refetch();
          setMonthlyDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default Layout; 