import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Card,
  Grid,
  Box,
  Stack,
} from '@mantine/core';
import { 
  IconBook, 
  IconRobot, 
  IconMessages, 
  IconNotebook 
} from '@tabler/icons-react';



function Home() {
  const features = [
    { 
      icon: <IconBook size={36} />, 
      title: '식물 백과사전', 
      description: '다양한 식물들의 상세한 정보와 전문적인 관리 방법을 한 곳에서 확인하세요.', 
      link: '/encyclopedia' 
    },
    { 
      icon: <IconRobot size={36}, 
      title: 'AI 식물 진단', 
      description: '최신 인공지능 기술로 식물의 건강 상태를 정확하게 진단하고 맞춤 케어 솔루션을 제공받으세요.', 
      link: '/diagnosis' 
    },
    { 
      icon: <IconMessages size={36} />, 
      title: '커뮤니티', 
      description: '전국의 식물 애호가들과 소통하고 경험을 나누며 함께 성장해보세요.', 
      link: '/community' 
    },
    { 
      icon: <IconNotebook size={36} />, 
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

  const heroSectionStyle = {
    background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 64,
    paddingBottom: 64,
  };

  const gradientTitleStyle = {
    background: 'linear-gradient(45deg, #ffffff, #f0f9ff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1.2,
    fontSize: 'clamp(40px, 5vw, 60px)',
    fontWeight: 800,
  };

  const glassButtonStyle = {
    background: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    color: 'white',
    paddingLeft: 32,
    paddingRight: 32,
  };

  const statsSectionStyle = {
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    paddingTop: 40,
    paddingBottom: 40,
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box style={heroSectionStyle}>
        <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
          <Stack align="center" gap="lg">
            <Title
              ta="center"
              style={gradientTitleStyle}
            >
              🌱 식물과 함께하는<br/>특별한 라이프스타일
            </Title>
            <Text
              ta="center"
              size="lg"
              style={{
                opacity: 0.95,
                maxWidth: 600,
                fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
              }}
            >
              AI 기술과 전문 지식이 결합된 스마트한 식물 관리 플랫폼에서 
              건강하고 아름다운 식물 라이프를 시작해보세요
            </Text>
            <Button
              component={Link}
              to="/diagnosis"
              size="lg"
              leftSection="🤖"
              style={glassButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              }}
            >
              AI 진단 체험
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container size="lg" py={48}>
        <Stack align="center" gap="md" mb={48}>
          <Title
            order={2}
            ta="center"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: '#1f2937',
            }}
          >
            🌿 식집사와 함께하는 특별한 경험
          </Title>
          <Text
            ta="center"
            size="lg"
            c="dimmed"
            style={{ maxWidth: 600 }}
          >
            초보자부터 전문가까지, 모든 식물 애호가를 위한 완벽한 솔루션을 제공합니다
          </Text>
        </Stack>

        <Grid gutter="md" mb={48}>
          {features.map((feature, index) => (
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }} key={index}>
              <Card 
                shadow="md" 
                padding="lg" 
                h="100%"
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                  }}
                />
                <Stack
                  align="center"
                  gap="xs"
                  style={{ 
                    paddingTop: 16,
                    height: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  <Stack align="center" gap="xs">
                    <Text size="36px" style={{ lineHeight: 1 }}>
                      {feature.icon}
                    </Text>
                    <Title order={4} ta="center" fw={600}>
                      {feature.title}
                    </Title>
                    <Text
                      size="sm"
                      c="dimmed"
                      ta="center"
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {feature.description}
                    </Text>
                  </Stack>
                  <Button
                    component={Link}
                    to={feature.link}
                    size="sm"
                    style={{
                      background: 'linear-gradient(45deg, #22c55e, #16a34a)',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(45deg, #16a34a, #15803d)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(45deg, #22c55e, #16a34a)';
                    }}
                  >
                    시작하기
                  </Button>
                </Stack>
              </Card>
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
                color: '#1f2937',
              }}
            >
               식집사의 성장하는 커뮤니티
            </Title>
            <Grid style={{ width: '100%' }} gutter="md">
              {stats.map((stat, idx) => (
                <Grid.Col 
                  span={{ base: 6, md: 3 }} 
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Stack align="center" gap={4}>
                    <Text
                      ta="center"
                      style={{
                        fontSize: 'clamp(36px, 4vw, 48px)',
                        fontWeight: 800,
                        color: '#22c55e',
                      }}
                    >
                      {stat.number}
                    </Text>
                    <Text
                      ta="center"
                      c="dimmed"
                      fw={500}
                      style={{
                        fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
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