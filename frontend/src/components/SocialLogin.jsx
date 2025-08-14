import React from 'react';
import { useState } from 'react';
import { Stack, Button, Divider, Text } from '@mantine/core';

function SocialLogin({showDivider = true }) {

  // 1. Add a loading state for each provider
  const [isNaverLoading, setIsNaverLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  const handleNaverLogin = () => {
    // 2. Set loading to true immediately
    setIsNaverLoading(true);

    setTimeout(() => {
    const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/callback/naver`;
    const STATE = Math.random().toString(36).substr(2, 11);
    
    if (!NAVER_CLIENT_ID) {
      console.error('REACT_APP_NAVER_CLIENT_ID is not set in environment variables');
      alert('네이버 로그인 설정이 올바르지 않습니다.');
      return;
    }
    
    localStorage.setItem('oauth_state', STATE);
    
    const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}`;
    
    
    window.location.href = naverLoginUrl;
  }, 50);
  };

  const handleKakaoLogin = () => {
    setIsKakaoLoading(true);

    setTimeout(() => {
    const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/callback/kakao`;
    
    if (!KAKAO_CLIENT_ID) {
      console.error('REACT_APP_KAKAO_CLIENT_ID is not set in environment variables');
      alert('카카오 로그인 설정이 올바르지 않습니다.');
      setIsKakaoLoading(false);
      return;
    }
    
    const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    
    window.location.href = kakaoLoginUrl;
  }, 50);
  };

  return (
    <>
      {showDivider && (
        <Divider 
          my="md" 
          label={
            <Text size="sm" c="dimmed">
              또는 소셜 계정으로 로그인
            </Text>
          } 
        />
      )}
      
      <Stack gap="md" mt="lg">
        <Button
          onClick={handleNaverLogin}
          loading={isNaverLoading}
          leftSection={
            !isNaverLoading && (
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                color: '#03C75A'
              }}>
                N
              </div>
            )
          }
          variant="filled"
          size="lg"
          fullWidth
          style={{
            backgroundColor: '#03C75A',
            border: 'none',
            borderRadius: '6px',
            height: 'clamp(45px, 8vw, 50px)',
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '700'
          }}
          styles={{
            root: {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#02B351',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(3, 199, 90, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0px)'
              }
            },
            inner: {
              justifyContent: 'center'
            },
            section: {
              marginRight: '12px'
            }
          }}
        >
          네이버로 로그인
        </Button>
        
        <Button
          onClick={handleKakaoLogin}
          loading={isKakaoLoading}
          leftSection={
            !isKakaoLoading && (
              <div style={{
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2C4.686 2 2 4.134 2 6.8c0 1.71 1.07 3.23 2.7 4.098l-.67 2.47c-.06.22.168.376.345.243l2.965-2.154C7.563 11.513 7.775 11.533 8 11.533c3.314 0 6-2.133 6-4.733S11.314 2 8 2z" fill="#000000"/>
                </svg>
              </div>
            )
          }
          variant="filled"
          size="lg"
          fullWidth
          style={{
            backgroundColor: '#FEE500',
            color: 'rgba(0, 0, 0, 0.85)',
            border: 'none',
            borderRadius: '12px',
            height: 'clamp(45px, 8vw, 50px)',
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '700'
          }}
          styles={{
            root: {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#F7E600',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(254, 229, 0, 0.4)'
              },
              '&:active': {
                transform: 'translateY(0px)'
              }
            },
            inner: {
              justifyContent: 'center'
            },
            section: {
              marginRight: '12px'
            }
          }}
        >
          카카오 로그인
        </Button>
      </Stack>
    </>
  );
}

export default SocialLogin;