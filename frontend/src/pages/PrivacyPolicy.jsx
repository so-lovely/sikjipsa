import React from 'react';
import { Container, Title, Text, Paper, Stack } from '@mantine/core';

const PrivacyPolicy = () => {
  return (
    <Container size="md" py={50}>
      <Paper p={30} shadow="sm" radius="md">
        <Title order={1} ta="center" c="green.7">
          개인정보처리방침
        </Title>
        
        <Stack spacing="md">
            <Title order={3} c="green.6">
              1. 개인정보의 처리 목적
            </Title>
            <Text mb="sm">
              식물 커뮤니티는 다음의 목적을 위하여 개인정보를 처리합니다:
            </Text>
            <Text size="sm" ml="md">
              • 회원 가입 및 관리
              <br />
              • 서비스 제공
              <br />
              • 커뮤니티 운영 및 관리
            </Text>

            <Title order={3} c="green.6">
              2. 처리하는 개인정보의 항목
            </Title>
            <Text mb="sm">
              다음과 같은 개인정보를 처리합니다:
            </Text>
            <Text size="sm" ml="md">
              • 필수항목: 이메일, 닉네임
              <br />
              • 선택항목: 프로필 사진
            </Text>

            <Title order={3} c="green.6">
              3. 개인정보의 보유 및 이용기간
            </Title>
            <Text>
              회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.
            </Text>

            <Title order={3} c="green.6">
              4. 개인정보의 제3자 제공
            </Title>
            <Text>
              개인정보를 제3자에게 제공하지 않습니다.
            </Text>

            <Title order={3} c="green.6">
              5. 개인정보처리의 위탁
            </Title>
            <Text>
              개인정보 처리업무를 외부에 위탁하지 않습니다.
            </Text>

            <Title order={3} c="green.6">
              6. 정보주체의 권리·의무 및 행사방법
            </Title>
            <Text>
              정보주체는 언제든지 개인정보 열람, 정정·삭제, 처리정지를 요구할 수 있습니다.
            </Text>

            <Title order={3} c="green.6">
              7. 개인정보의 안전성 확보조치
            </Title>
            <Text mb="sm">
              개인정보 보호를 위해 다음과 같은 조치를 취합니다:
            </Text>
            <Text size="sm" ml="md">
              • 개인정보 요구 최소화
              <br />
              • 접근권한 제한
            </Text>

            <Text size="sm" c="gray.6" ta="right">
              시행일자: 2025년 8월 11일
            </Text>
        </Stack>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;