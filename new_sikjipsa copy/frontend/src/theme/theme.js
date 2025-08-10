import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'green',
  
  colors: {
    // Custom green palette for plant theme
    green: [
      '#f0fdf4',
      '#dcfce7', 
      '#bbf7d0',
      '#86efac',
      '#4ade80',
      '#22c55e',
      '#16a34a',
      '#15803d',
      '#166534',
      '#14532d'
    ]
  },

  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600'
  },

  radius: {
    xs: '4px',
    sm: '6px', 
    md: '8px',
    lg: '12px',
    xl: '16px'
  },

  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px', 
    xl: '24px'
  },

  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04)'
  },

  other: {
    // Custom plant-themed colors
    plantPrimary: '#22c55e',
    plantSecondary: '#16a34a', 
    plantAccent: '#4ade80',
    plantLight: '#f0fdf4',
    plantDark: '#14532d'
  }
});