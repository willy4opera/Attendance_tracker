import theme from '../config/theme';

export const applyTheme = () => {
  // Set CSS variables
  const root = document.documentElement;
  
  // Apply color variables
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-warning', theme.colors.warning);
  root.style.setProperty('--color-info', theme.colors.info);
  root.style.setProperty('--color-bg-default', theme.colors.background.default);
  root.style.setProperty('--color-bg-paper', theme.colors.background.paper);
  root.style.setProperty('--color-text-primary', theme.colors.text.primary);
  root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
  
  // Apply spacing variables
  root.style.setProperty('--spacing-xs', theme.spacing.xs);
  root.style.setProperty('--spacing-sm', theme.spacing.sm);
  root.style.setProperty('--spacing-md', theme.spacing.md);
  root.style.setProperty('--spacing-lg', theme.spacing.lg);
  root.style.setProperty('--spacing-xl', theme.spacing.xl);
  
  // Apply border radius variables
  root.style.setProperty('--radius-small', theme.borderRadius.small);
  root.style.setProperty('--radius-medium', theme.borderRadius.medium);
  root.style.setProperty('--radius-large', theme.borderRadius.large);
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.colors.primary);
  }
};
