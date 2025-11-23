import { createTheme, ThemeOptions } from '@mui/material/styles';

const getTheme = (mode: 'light' | 'dark') => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9',
        light: mode === 'light' ? '#42a5f5' : '#e3f2fd',
        dark: mode === 'light' ? '#1565c0' : '#42a5f5',
      },
      secondary: {
        main: mode === 'light' ? '#9c27b0' : '#ce93d8',
        light: mode === 'light' ? '#ba68c8' : '#f3e5f5',
        dark: mode === 'light' ? '#7b1fa2' : '#ab47bc',
      },
      success: {
        main: mode === 'light' ? '#2e7d32' : '#66bb6a',
      },
      warning: {
        main: mode === 'light' ? '#ed6c02' : '#ffa726',
      },
      error: {
        main: mode === 'light' ? '#d32f2f' : '#f44336',
      },
      info: {
        main: mode === 'light' ? '#0288d1' : '#29b6f6',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#0a0a0a',
        paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
      },
      text: {
        primary: mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.95)',
        secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
      },
      divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      action: {
        hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
        selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.1)' 
              : '0 2px 8px rgba(0,0,0,0.5)',
            backgroundImage: mode === 'dark' ? 'none' : undefined,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: mode === 'dark' ? 'none' : undefined,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === 'light' ? 'rgba(224, 224, 224, 1)' : 'rgba(81, 81, 81, 1)',
          },
          head: {
            fontWeight: 600,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: mode === 'dark' ? 'none' : undefined,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light'
              ? '0 2px 4px rgba(0,0,0,0.1)'
              : '0 2px 4px rgba(0,0,0,0.3)',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

export default getTheme;