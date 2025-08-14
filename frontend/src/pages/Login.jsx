import React from 'react';
import { Container, Card, Title, Text, Stack, Box } from '@mantine/core';
import SocialLogin from '../components/SocialLogin';
import { 
  IconBook, 
  IconRobot, 
  IconMessages, 
  IconSeedling,
} from '@tabler/icons-react';
function Login() {
  return (
    <Container 
      size="sm" 
      style={{
        padding: '1rem',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Card 
        shadow="sm" 
        radius="lg" 
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          position: 'relative',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          '@media (max-width: 480px)': {
            margin: '1rem 0.5rem',
            maxWidth: 'calc(100vw - 1rem)'
          }
        }}
      >
          {/* Naver-style top accent */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: '#03C75A',
              borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0'
            }}
          />

          <Stack align="center" gap="2rem">
            {/* Logo Area */}
            <Stack align="center" gap="1rem" mt="1rem">
              <IconSeedling size={48} color="#03C75A" stroke={2} />
              <Title order={1} size={28} fw={700} ta="center" c="#1A1A1A">
                식집사
              </Title>
            </Stack>

            {/* Welcome Message */}
            <Stack align="center" gap="0.5rem">
              <Text size="md" ta="center" c="#666666" fw={400}>
                소셜 계정으로 간편하게 로그인하세요
              </Text>
            </Stack>

            {/* Social Login */}
            <Box w="100%" mt="1rem">
              <SocialLogin showDivider={false} />
            </Box>
            
            {/* Features Preview */}
            <Box w="100%" mt="1.5rem">
              <Text size="sm" ta="center" c="#999999" mb="1rem">
                식집사에서 할 수 있는 것들
              </Text>
              
              <Stack gap="0.75rem">
                <Box style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Box style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconBook size={14} color="#03C75A" />
                  </Box>
                  <Text size="sm" c="#666666">식물 백과사전 및 관리 가이드</Text>
                </Box>
                
                <Box style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Box style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconRobot size={14} color="#03C75A" />
                  </Box>
                  <Text size="sm" c="#666666">AI 식물 건강 상태 진단</Text>
                </Box>
                
                <Box style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Box style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#F0FDF4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconMessages size={14} color="#03C75A" />
                  </Box>
                  <Text size="sm" c="#666666">식물 애호가 커뮤니티</Text>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Card>
    </Container>
  );
}

export default Login;