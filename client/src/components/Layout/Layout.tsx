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
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  Event as EventIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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
        position="static" 
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: '#1e40af',
                  cursor: 'pointer',
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                }}
                onClick={() => navigate('/community')}
              >
                言語学習コミュニティ
              </Typography>
            </Box>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
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
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      backgroundColor: '#1e40af',
                      color: 'white',
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
            プロフィール
          </Typography>
        </MenuItem>

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
            メンバーリスト
          </Typography>
        </MenuItem>

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
            このコミュニティでできること
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
            イベントスケジュール
          </Typography>
        </MenuItem>

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
              管理者パネル
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
            ログアウト
          </Typography>
        </MenuItem>
      </Menu>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 