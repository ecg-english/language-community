import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // ローカルストレージからテーマ設定を取得
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // システム設定を確認
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // テーマ設定をローカルストレージに保存
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#90caf9' : '#1976d2',
        light: isDarkMode ? '#e3f2fd' : '#42a5f5',
        dark: isDarkMode ? '#42a5f5' : '#1565c0',
        contrastText: isDarkMode ? '#000000' : '#ffffff',
      },
      secondary: {
        main: isDarkMode ? '#f48fb1' : '#dc004e',
        light: isDarkMode ? '#fce4ec' : '#ff5983',
        dark: isDarkMode ? '#c2185b' : '#9a0036',
        contrastText: isDarkMode ? '#000000' : '#ffffff',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? '#b0b0b0' : '#666666',
      },
      divider: isDarkMode ? '#333333' : '#e0e0e0',
      action: {
        hover: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        selected: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        disabled: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        disabledBackground: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        'Noto Sans JP',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.025em',
        '@media (max-width:900px)': {
          fontSize: '2rem',
        },
        '@media (max-width:600px)': {
          fontSize: '1.75rem',
        },
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.025em',
        '@media (max-width:900px)': {
          fontSize: '1.75rem',
        },
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.025em',
        '@media (max-width:900px)': {
          fontSize: '1.5rem',
        },
        '@media (max-width:600px)': {
          fontSize: '1.25rem',
        },
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.015em',
        '@media (max-width:900px)': {
          fontSize: '1.25rem',
        },
        '@media (max-width:600px)': {
          fontSize: '1.125rem',
        },
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:900px)': {
          fontSize: '1.125rem',
        },
        '@media (max-width:600px)': {
          fontSize: '1rem',
        },
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
        '@media (max-width:900px)': {
          fontSize: '1rem',
        },
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.7,
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        '@media (max-width:600px)': {
          fontSize: '0.75rem',
        },
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.875rem',
        },
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.5,
        '@media (max-width:600px)': {
          fontSize: '0.75rem',
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            border: isDarkMode ? '1px solid #333' : '1px solid #e0e0e0',
            borderRadius: 12,
            boxShadow: isDarkMode 
              ? '0 1px 3px 0 rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(255, 255, 255, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: isDarkMode 
                ? '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            '& .MuiCardContent-root': {
              color: isDarkMode ? '#ffffff' : '#000000',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
            border: isDarkMode ? '1px solid #333' : '1px solid rgba(0, 0, 0, 0.06)',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            boxShadow: isDarkMode 
              ? '0 1px 2px 0 rgba(255, 255, 255, 0.05)'
              : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: isDarkMode ? '#2a2a2a' : '#fafafb',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: isDarkMode ? '#333333' : '#f9fafb',
              },
              '&.Mui-focused': {
                backgroundColor: isDarkMode ? '#333333' : '#ffffff',
                '& fieldset': {
                  borderWidth: 2,
                },
              },
              '& input': {
                color: isDarkMode ? '#ffffff' : '#000000',
              },
              '& textarea': {
                color: isDarkMode ? '#ffffff' : '#000000',
              },
            },
            '& .MuiInputLabel-root': {
              color: isDarkMode ? '#b0b0b0' : '#666666',
              '&.Mui-focused': {
                color: isDarkMode ? '#90caf9' : '#1976d2',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            letterSpacing: '0.025em',
            padding: '12px 24px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '@media (max-width:600px)': {
              fontSize: '0.875rem',
              padding: '10px 16px',
            },
          },
          contained: {
            boxShadow: isDarkMode 
              ? '0 1px 3px 0 rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(255, 255, 255, 0.06)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: isDarkMode 
                ? '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.8rem',
            '@media (max-width:600px)': {
              fontSize: '0.75rem',
            },
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: 24,
            paddingRight: 24,
            '@media (max-width:600px)': {
              paddingLeft: 16,
              paddingRight: 16,
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            border: isDarkMode ? '1px solid #333' : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: isDarkMode 
              ? '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          icon: {
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            '&:before': {
              backgroundColor: isDarkMode ? '#333' : '#e0e0e0',
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            '&.Mui-expanded': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 