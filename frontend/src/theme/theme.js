import { createTheme } from '@mantine/core';

export const theme = createTheme({
  fontFamily: "Pretendard, 'Noto Sans KR', system-ui, -apple-system, sans-serif",
  
  headings: { 
    fontFamily: "Poppins, Inter, Pretendard, sans-serif",
    fontWeight: '700',
    sizes: {
      h1: { fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', lineHeight: '1.05' },
      h2: { fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: '700', lineHeight: '1.15' },
      h3: { fontSize: '28px', fontWeight: '700', lineHeight: '1.15' }
    }
  },

  colors: {
    primary: [
      '#E6F9EE',  // 0
      '#CCF4DE',  // 1  
      '#99E9BF',  // 2
      '#34D399',  // 3 (--primary-400)
      '#22C55E',  // 4 (--primary-500)
      '#16A34A',  // 5 (--primary-600) 
      '#0F8A3A',  // 6
      '#0D7332',  // 7
      '#0A5D2A',  // 8
      '#074722'   // 9
    ],
    accent: [
      '#FFF7ED',
      '#FFEDD5', 
      '#FED7AA',
      '#FDBA74',
      '#FB923C',
      '#FF7A18',  // 5 (--accent)
      '#EA580C',
      '#C2410C',
      '#9A3412',
      '#7C2D12'
    ]
  },

  primaryColor: 'primary',

  defaultRadius: 'md',

  radius: {
    xs: '4px',
    sm: '8px',   // --radius-sm
    md: '14px',  // --radius-md  
    lg: '20px',  // --radius-lg
    xl: '24px'
  },

  spacing: {
    xxs: '4px',   // --space-xxs
    xs: '8px',    // --space-xs
    sm: '12px',   // --space-sm
    md: '20px',   // --space-md
    lg: '32px',   // --space-lg
    xl: '48px',   // --space-xl
    xxl: '80px'   // --space-xxl
  },

  shadows: {
    xs: '0 2px 8px rgba(15, 23, 36, 0.04)',
    sm: '0 6px 18px rgba(15, 23, 36, 0.06)',  // --shadow-sm
    md: '0 12px 30px rgba(15, 23, 36, 0.09)', // --shadow-md
    lg: '0 16px 40px rgba(15, 23, 36, 0.12)',
    xl: '0 24px 60px rgba(15, 23, 36, 0.15)'
  },

  other: {
    // Design tokens
    bg: '#F8FAFC',
    surface: '#ffffff', 
    charcoal: '#0F1724',
    muted: '#6B7280',
    glass: 'rgba(15, 23, 36, 0.04)',
    success: '#10B981',
    warning: '#F59E0B',
    primaryGradient: 'linear-gradient(135deg, #34D399 0%, #16A34A 100%)'
  }
});