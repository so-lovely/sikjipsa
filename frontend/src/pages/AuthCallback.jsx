import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Stack, Text, Loader, Center, Alert, Button } from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/auth';

function AuthCallback() {
  const { provider } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');
  const { login } = useAuth();


  const hasProcessed = useRef(false);

  useEffect(() => {
    // 3. Add a guard clause at the top of the effect.
    // If this effect has run once, do not run it again.
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error('소셜 로그인이 취소되었습니다.');
        }

        if (!code) {
          throw new Error('인증 코드를 받을 수 없습니다.');
        }

        // 상태 확인 (네이버의 경우)
        if (provider === 'naver' && state) {
          const storedState = localStorage.getItem('oauth_state');
          if (state !== storedState) {
            throw new Error('잘못된 요청입니다.');
          }
        }

        // 백엔드에 인증 코드 전송
        let response;
        if (provider === 'naver') {
          response = await authAPI.socialLogin('naver', {
            code,
            state,
            redirect_uri: `${window.location.origin}/auth/callback/naver`
          });
        } else if (provider === 'kakao') {
          response = await authAPI.socialLogin('kakao', {
            code,
            redirect_uri: `${window.location.origin}/auth/callback/kakao`
          });
        } else {
          throw new Error('지원하지 않는 소셜 로그인 방식입니다.');
        }

        // 로그인 성공 처리
        if (response?.access_token) {
          // AuthContext를 통해 로그인 처리 (localStorage는 authAPI에서 자동 처리됨)
          login(response.user);
          setStatus('success');
          
          // 2초 후 홈으로 리다이렉트
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          throw new Error('로그인에 실패했습니다.');
        }

      } catch (err) {
        console.error('Social login error:', err);
        setError(err.message || '로그인 중 오류가 발생했습니다.');
        setStatus('error');
      } finally {
        // 상태 정리
        localStorage.removeItem('oauth_state');
      }
    };

    processCallback();
  }, [provider, searchParams, navigate, login]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <Stack align="center" gap="md">
            <Loader color="green" size="xl" />
            <Text size="lg" fw={600} c="gray.7">
              로그인 처리 중입니다...
            </Text>
            <Text size="sm" c="dimmed">
              잠시만 기다려 주세요.
            </Text>
          </Stack>
        );
      
      case 'success':
        return (
          <Stack align="center" gap="md">
            <IconCheck size={64} color="var(--mantine-color-green-6)" />
            <Text size="lg" fw={600} c="green.7">
              로그인 성공!
            </Text>
            <Text size="sm" c="dimmed">
              메인 페이지로 이동합니다.
            </Text>
          </Stack>
        );
      
      case 'error':
        return (
          <Stack align="center" gap="md">
            <IconX size={64} color="var(--mantine-color-red-6)" />
            <Text size="lg" fw={600} c="red.7">
              로그인 실패
            </Text>
            <Alert 
              icon={<IconAlertCircle size={16} />}
              color="red" 
              variant="light"
              style={{ textAlign: 'center' }}
            >
              {error}
            </Alert>
            <Button 
              onClick={() => navigate('/login')}
              variant="gradient"
              gradient={{ from: 'green.5', to: 'green.6' }}
            >
              다시 시도하기
            </Button>
          </Stack>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container size="sm" py="xl">
      <Center style={{ minHeight: '60vh' }}>
        {renderContent()}
      </Center>
    </Container>
  );
}

export default AuthCallback;