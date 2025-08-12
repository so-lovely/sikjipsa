import React from 'react';
import { Container, Title, Text, Stack, Box, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconRobot, IconMessages } from '@tabler/icons-react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const Hero = () => {
  const heroStyle = {
    background: 'var(--primary-gradient)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '420px',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 'var(--space-xxl)',
    paddingBottom: 'var(--space-xxl)'
  };

  const containerStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '18px',
    padding: 'var(--space-xl)',
    position: 'relative',
    zIndex: 1,
    maxWidth: '900px',
    margin: '0 auto'
  };

  const titleStyle = {
    background: 'linear-gradient(45deg, #ffffff, #f0f9ff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: '1.05',
    fontSize: 'clamp(40px, 5vw, 60px)',
    fontWeight: 800,
    textAlign: 'center',
    letterSpacing: 'var(--tracking-tighter)'
  };

  const subtitleStyle = {
    opacity: 0.95,
    fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
    textAlign: 'center',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto'
  };

  const buttonGroupStyle = {
    gap: 'var(--space-md)',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const primaryButtonStyle = {
    background: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    color: 'white',
    height: '52px',
    fontSize: '16px',
    fontWeight: 600,
    paddingLeft: 'var(--space-lg)',
    paddingRight: 'var(--space-lg)',
    borderRadius: 'var(--radius-lg)'
  };

  const secondaryButtonStyle = {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.6)',
    color: 'white',
    height: '52px',
    fontSize: '16px',
    fontWeight: 600,
    paddingLeft: 'var(--space-lg)',
    paddingRight: 'var(--space-lg)',
    borderRadius: 'var(--radius-lg)'
  };

  return (
    <Box style={heroStyle}>
      <Container size="lg">
        <Box style={containerStyle}>
          <Stack align="center" gap="lg">
            <Title style={titleStyle}>
              식물과 함께하는<br />특별한 라이프스타일
            </Title>
            
            <Text style={subtitleStyle}>
              AI 기술과 전문 지식이 결합된 스마트한 식물 관리 플랫폼에서 
              건강하고 아름다운 식물 라이프를 시작해보세요
            </Text>
            
            <Group style={buttonGroupStyle}>
              <PrimaryButton
                component={Link}
                to="/diagnosis"
                size="lg"
                leftSection={<IconRobot size={20} />}
                style={primaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, primaryButtonStyle);
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                AI 진단 체험
              </PrimaryButton>
              
              <SecondaryButton
                component={Link}
                to="/community"
                size="lg"
                leftSection={<IconMessages size={20} />}
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, secondaryButtonStyle);
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                커뮤니티 참여
              </SecondaryButton>
            </Group>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Hero;