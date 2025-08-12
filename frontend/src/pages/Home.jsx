import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Grid,
  Box,
  Stack,
} from '@mantine/core';
import { 
  IconBook, 
  IconRobot, 
  IconMessages, 
  IconNotebook,
  IconPlant
} from '@tabler/icons-react';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';



function Home() {
  const features = [
    { 
      icon: <IconBook />, 
      title: '식물 백과사전', 
      description: '다양한 식물들의 상세한 정보와 전문적인 관리 방법을 한 곳에서 확인하세요.', 
      link: '/encyclopedia' 
    },
    { 
      icon: <IconRobot />, 
      title: 'AI 식물 진단', 
      description: '최신 인공지능 기술로 식물의 건강 상태를 정확하게 진단하고 맞춤 케어 솔루션을 제공받으세요.', 
      link: '/diagnosis' 
    },
    { 
      icon: <IconMessages />, 
      title: '커뮤니티', 
      description: '전국의 식물 애호가들과 소통하고 경험을 나누며 함께 성장해보세요.', 
      link: '/community' 
    },
    { 
      icon: <IconNotebook />, 
      title: '성장 일기', 
      description: '내 식물의 성장 과정을 체계적으로 기록하고 추적하여 더 나은 관리를 해보세요.', 
      link: '/diary' 
    }
  ];

  const stats = [
    { number: '10,000+', label: '행복한 회원' },
    { number: '500+', label: '식물 품종' },
    { number: '50,000+', label: 'AI 진단 완료' },
    { number: '99%', label: '고객 만족도' }
  ];

  const statsSectionStyle = {
    backgroundColor: 'var(--surface)',
    borderTop: '1px solid rgba(15, 23, 36, 0.08)',
    paddingTop: 'var(--space-xxl)',
    paddingBottom: 'var(--space-xxl)'
  };

  return (
    <Box>
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Container size="lg" style={{ paddingTop: 'var(--space-xxl)', paddingBottom: 'var(--space-xxl)' }}>
        <Stack align="center" gap="md" style={{ marginBottom: 'var(--space-xxl)' }}>
          <Title
            order={2}
            ta="center"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: 'var(--charcoal)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            <IconPlant stroke={1.5} size={32} color="var(--primary-600)" />
            식집사와 함께하는 특별한 경험
          </Title>
          <Text
            ta="center"
            size="lg"
            style={{ 
              maxWidth: 600, 
              color: 'var(--muted)',
              fontSize: '18px',
              lineHeight: '1.6'
            }}
          >
            초보자부터 전문가까지, 모든 식물 애호가를 위한 완벽한 솔루션을 제공합니다
          </Text>
        </Stack>

        <Grid gutter="lg" style={{ marginBottom: 'var(--space-xxl)' }}>
          {features.map((feature, index) => (
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }} key={index}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                link={feature.link}
              />
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box style={statsSectionStyle}>
        <Container size="lg">
          <Stack align="center" gap="lg">
            <Title
              order={2}
              ta="center"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 700,
                color: 'var(--charcoal)',
              }}
            >
               식집사의 성장하는 커뮤니티
            </Title>
            <Grid style={{ width: '100%' }} gutter="lg">
              {stats.map((stat, idx) => (
                <Grid.Col 
                  span={{ base: 6, md: 3 }} 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Stack align="center" gap="xs">
                    <Text
                      ta="center"
                      className="gradient-text"
                      style={{
                        fontSize: 'clamp(36px, 4vw, 48px)',
                        fontWeight: 800,
                        background: 'var(--primary-gradient)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {stat.number}
                    </Text>
                    <Text
                      ta="center"
                      style={{
                        fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                        fontWeight: 500,
                        color: 'var(--muted)'
                      }}
                    >
                      {stat.label}
                    </Text>
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;