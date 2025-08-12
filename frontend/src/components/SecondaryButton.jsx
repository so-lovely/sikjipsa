import React from 'react';
import { Button } from '@mantine/core';

const SecondaryButton = ({ 
  children, 
  leftSection, 
  rightSection, 
  size = 'md', 
  fullWidth = false,
  className = '',
  style = {},
  disabled = false,
  loading = false,
  ...props 
}) => {
  const baseStyle = {
    background: 'transparent',
    border: '2px solid var(--primary-500)',
    borderRadius: size === 'lg' ? 'var(--radius-lg)' : 'var(--radius-md)',
    color: 'var(--primary-600)',
    fontWeight: 600,
    height: size === 'lg' ? '52px' : size === 'md' ? '42px' : '36px',
    fontSize: size === 'lg' ? '16px' : size === 'md' ? '14px' : '12px',
    transition: 'all 160ms cubic-bezier(0.2, 0.9, 0.3, 1)',
    ...style
  };

  const hoverStyle = {
    background: 'var(--primary-500)',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-sm)'
  };

  return (
    <Button
      className={`button-hover ${className}`}
      style={baseStyle}
      size={size}
      fullWidth={fullWidth}
      leftSection={leftSection}
      rightSection={rightSection}
      disabled={disabled}
      loading={loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, baseStyle);
        }
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default SecondaryButton;