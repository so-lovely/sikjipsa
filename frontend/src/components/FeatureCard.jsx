import React from 'react';
import { Card, Stack, Text, Title, Box } from '@mantine/core';
import { Link } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  link, 
  buttonText = "시작하기",
  className = '',
  ...props 
}) => {
  const cardStyle = {
    position: 'relative',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--surface)',
    border: '1px solid rgba(15, 23, 36, 0.08)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'transform 160ms cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 160ms cubic-bezier(0.2, 0.9, 0.3, 1)',
    overflow: 'hidden',
    height: '100%'
  };

  const hoverStyle = {
    transform: 'translateY(-6px)',
    boxShadow: 'var(--shadow-md)'
  };

  const accentBarStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'var(--primary-gradient)',
    borderTopLeftRadius: 'var(--radius-lg)',
    borderTopRightRadius: 'var(--radius-lg)'
  };

  const iconContainerStyle = {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'var(--glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary-600)',
    marginBottom: 'var(--space-md)'
  };

  return (
    <Card
      className={`card-hover ${className}`}
      style={cardStyle}
      padding="lg"
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, { ...cardStyle, ...hoverStyle });
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, cardStyle);
      }}
      role={link ? "link" : "article"}
      tabIndex={link ? 0 : -1}
      {...props}
    >
      <Box style={accentBarStyle} />
      
      <Stack
        align="center"
        gap="sm"
        style={{ 
          paddingTop: 'var(--space-md)',
          height: '100%',
          justifyContent: 'space-between'
        }}
      >
        <Stack align="center" gap="sm">
          <Box style={iconContainerStyle}>
            {React.cloneElement(icon, { 
              size: 24, 
              stroke: 1.5,
              style: { color: 'inherit' }
            })}
          </Box>
          
          <Title
            order={4}
            style={{
              textAlign: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--charcoal)',
              marginBottom: 'var(--space-xs)'
            }}
          >
            {title}
          </Title>
          
          <Text
            size="sm"
            style={{
              textAlign: 'center',
              color: 'var(--muted)',
              lineHeight: 1.6,
              paddingLeft: 'var(--space-sm)',
              paddingRight: 'var(--space-sm)'
            }}
          >
            {description}
          </Text>
        </Stack>
        
        {link && (
          <PrimaryButton
            component={Link}
            to={link}
            size="sm"
            style={{ marginTop: 'var(--space-sm)' }}
          >
            {buttonText}
          </PrimaryButton>
        )}
      </Stack>
    </Card>
  );
};

export default FeatureCard;