import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
      <Helmet>
        <title>식집사 - 식물과 함께하는 특별한 경험</title>
        <meta name="description" content="AI 식물 진단, 식물 백과사전, 커뮤니티, 성장일기까지! 식물 애호가들을 위한 완벽한 솔루션. 초보자부터 전문가까지 모든 식물 관리 정보를 한 곳에서 만나보세요." />
        <meta name="keywords" content="식물, 식물관리, AI진단, 식물백과사전, 식물커뮤니티, 성장일기, 화분, 관엽식물, 원예" />
        <meta property="og:title" content="식집사 - 식물과 함께하는 특별한 경험" />
        <meta property="og:description" content="AI 식물 진단, 식물 백과사전, 커뮤니티, 성장일기까지! 식물 애호가들을 위한 완벽한 솔루션" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.sikjipsa.com/" />
        <meta property="og:image" content="https://res.cloudinary.com/dfn2v65hg/image/upload/v1755009756/Screenshot_2025-08-12_at_11.41.42_PM_dodkwi.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="식집사 - 식물과 함께하는 특별한 경험" />
        <meta name="twitter:description" content="AI 식물 진단, 식물 백과사전, 커뮤니티, 성장일기까지! 식물 애호가들을 위한 완벽한 솔루션" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dfn2v65hg/image/upload/v1755009756/Screenshot_2025-08-12_at_11.41.42_PM_dodkwi.png" />
        <link rel="canonical" href="https://www.sikjipsa.com/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "식집사",
            "description": "식물 AI진단, 커뮤니티, 식물 성장일기, 식물 백과사전 서비스",
            "url": "https://www.sikjipsa.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.sikjipsa.com/encyclopedia?search={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
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