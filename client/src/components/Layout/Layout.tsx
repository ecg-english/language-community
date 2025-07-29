import React, { ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Chip,
  Stack,
  Fade,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  AdminPanelSettings,
  Language,
  Person as PersonIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  Event as EventIcon,
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
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'ECG講師':
      case 'JCG講師':
        return 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
      case 'ECGメンバー':
        return 'linear-gradient(135deg, #48cae4 0%, #0077b6 100%)';
      case 'JCGメンバー':
        return 'linear-gradient(135deg, #a8e6cf 0%, #56ab2f 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
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
          backdropFilter: 'blur(20px)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: 40,
                height: 40,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              <Language sx={{ color: 'white' }} />
            </Avatar>
            
            <Typography
              variant="h5"
              component="div"
              sx={{ 
                cursor: 'pointer',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onClick={() => navigate('/community')}
            >
              言語学習コミュニティ
            </Typography>
          </Stack>
          
          {user && (
            <Fade in timeout={500}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={user.role}
                  size="small"
                  sx={{ 
                    background: getRoleGradient(user.role),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
                
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  sx={{
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  {user.avatar_url ? (
                    <Avatar 
                      src={user.avatar_url} 
                      sx={{ 
                        width: 36, 
                        height: 36,
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                      }} 
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: getRoleGradient(user.role),
                        fontSize: '1rem',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </IconButton>
                
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  sx={{
                    '& .MuiPaper-root': {
                      borderRadius: 2,
                      minWidth: 200,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      mt: 1,
                    },
                  }}
                >
                  <MenuItem 
                    disabled
                    sx={{
                      py: 2,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      mb: 1,
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {user.username}
                      </Typography>
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          background: getRoleGradient(user.role),
                          color: 'white',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Stack>
                  </MenuItem>
                  
                  {user.role === 'サーバー管理者' && (
                    <MenuItem 
                      onClick={handleAdminPanel}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        },
                      }}
                    >
                      <AdminPanelSettings sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight={500}>
                        管理者パネル
                      </Typography>
                    </MenuItem>
                  )}

                  <MenuItem 
                    onClick={handleProfile}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                      },
                    }}
                  >
                    <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={500}>
                      プロフィール
                    </Typography>
                  </MenuItem>

                  <MenuItem 
                    onClick={handleMemberList}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
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
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
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
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                      },
                    }}
                  >
                    <EventIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={500}>
                      イベントスケジュール
                    </Typography>
                  </MenuItem>

                  <MenuItem 
                    onClick={handleLogout}
                    sx={{
                      py: 1.5,
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(244, 67, 54, 0.04)',
                      },
                    }}
                  >
                    <Logout sx={{ mr: 2 }} />
                    <Typography variant="body2" fontWeight={500}>
                      ログアウト
                    </Typography>
                  </MenuItem>
                </Menu>
              </Stack>
            </Fade>
          )}
        </Toolbar>
      </AppBar>
      
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