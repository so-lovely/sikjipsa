import React from 'react';
import { Button } from '@mantine/core';

const PrimaryButton = ({ 
  children, 
  leftSection, 
  rightSection, 
  size = 'md', 
  variant = 'filled',
  fullWidth = false,
  className = '',
  style = {},
  disabled = false,
  loading = false,
  ...props 
}) => {
  const baseStyle = {
    background: 'var(--primary-gradient)',
    border: 'none',
    borderRadius: size === 'lg' ? 'var(--radius-lg)' : 'var(--radius-md)',
    color: 'white',
    fontWeight: 600,
    height: size === 'lg' ? '52px' : size === 'md' ? '42px' : '36px',
    fontSize: size === 'lg' ? '16px' : size === 'md' ? '14px' : '12px',
    transition: 'transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 160ms cubic-bezier(0.2, 0.9, 0.3, 1)',
    boxShadow: 'var(--shadow-sm)',
    ...style
  };

  const hoverStyle = {
    transform: 'scale(1.02) translateY(-2px)',
    boxShadow: 'var(--shadow-md)',
    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
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

export default PrimaryButton;