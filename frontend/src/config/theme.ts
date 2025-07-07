export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
}

export interface Theme {
  colors: ThemeColors;
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

const theme: Theme = {
  colors: {
    primary: import.meta.env.VITE_THEME_COLOR_PRIMARY || '#fddc9a',
    secondary: import.meta.env.VITE_THEME_COLOR_SECONDARY || '#000000',
    success: import.meta.env.VITE_THEME_COLOR_SUCCESS || '#4caf50',
    error: import.meta.env.VITE_THEME_COLOR_ERROR || '#f44336',
    warning: import.meta.env.VITE_THEME_COLOR_WARNING || '#ff9800',
    info: import.meta.env.VITE_THEME_COLOR_INFO || '#2196f3',
    background: {
      default: import.meta.env.VITE_THEME_BG_DEFAULT || '#f5f5f5',
      paper: import.meta.env.VITE_THEME_BG_PAPER || '#ffffff',
    },
    text: {
      primary: import.meta.env.VITE_THEME_TEXT_PRIMARY || '#000000',
      secondary: import.meta.env.VITE_THEME_TEXT_SECONDARY || '#666666',
    },
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
};

export default theme;
