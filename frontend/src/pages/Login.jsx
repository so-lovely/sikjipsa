import React from 'react';
import { Container, Card, Title, Text, Stack, List, ThemeIcon, Center, Box } from '@mantine/core';
import SocialLogin from '../components/SocialLogin';
import { 
  IconBook, 
  IconRobot, 
  IconMessages, 
  IconNotebook,
  IconPlant,
  IconSeedling,
  IconUserCircle
} from '@tabler/icons-react';
function Login() {
  return (
    <Container size="sm" py="xl">
      <Center style={{ minHeight: '70vh' }}>
        <Card 
          shadow="xl" 
          radius="xl" 
          p="xl"
          style={{
            width: '100%',
            maxWidth: 450,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            border: '1px solid var(--mantine-color-gray-2)'
          }}
        >
          {/* Top accent line */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #4ade80, #22c55e)',
              borderRadius: 'var(--mantine-radius-xl) var(--mantine-radius-xl) 0 0'
            }}
          />

          <Stack align="center" gap="xl">
            {/* Plant Icon */}
            <IconSeedling size={64} color="var(--mantine-color-green-6)" stroke={1.5} />

            {/* Title */}
            <Stack align="center" gap="sm">
              <Title order={1} size={40} fw={700} ta="center" c="gray.8">
                <Text component="span" c="green.6">식집사</Text> 로그인
              </Title>
              <Text size="lg" ta="center" c="gray.6" lh={1.6} maw={400}>
                소셜 계정으로 간편하게 로그인하고<br />
                식물과 함께하는 특별한 여정을 시작하세요
              </Text>
            </Stack>

            {/* Features Section */}
            <Box w="100%">
              <Title order={3} size="lg" fw={600} ta="center" c="gray.8" mb="lg">
                <IconPlant size={20} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 8 }} />
                식집사에서 할 수 있는 것들
              </Title>
              
              <Card
                radius="lg"
                p="lg"
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  borderLeft: '4px solid var(--mantine-color-green-5)'
                }}
              >
                <List spacing="sm" size="sm">
                  <List.Item
                    icon={
                      <ThemeIcon color="green" size={24} radius="xl" variant="light">
                        <IconBook size={14} />
                      </ThemeIcon>
                    }
                  >
                    상세한 식물 백과사전으로 전문 지식 습득
                  </List.Item>
                  <List.Item
                    icon={
                      <ThemeIcon color="green" size={24} radius="xl" variant="light">
                        <IconRobot size={14} />
                      </ThemeIcon>
                    }
                  >
                    AI 기술로 식물 건강 상태 실시간 진단
                  </List.Item>
                  <List.Item
                    icon={
                      <ThemeIcon color="green" size={24} radius="xl" variant="light">
                        <IconMessages size={14} />
                      </ThemeIcon>
                    }
                  >
                    식물 애호가들과 경험과 팁 공유
                  </List.Item>
                  <List.Item
                    icon={
                      <ThemeIcon color="green" size={24} radius="xl" variant="light">
                        <IconNotebook size={14} />
                      </ThemeIcon>
                    }
                  >
                    나만의 식물 성장 일기 작성
                  </List.Item>
                </List>
              </Card>
            </Box>
            
            {/* Social Login */}
            <Box w="100%">
              <SocialLogin showDivider={false} />
            </Box>
          </Stack>
        </Card>
      </Center>
    </Container>
  );
}

export default Login;