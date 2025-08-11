import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          개인정보처리방침
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            1. 개인정보의 처리 목적
          </Typography>
          <Typography variant="body1" paragraph>
            식물 커뮤니티는 다음의 목적을 위하여 개인정보를 처리합니다:
          </Typography>
          <Typography variant="body2" paragraph sx={{ ml: 2 }}>
            • 회원 가입 및 관리
            <br />
            • 서비스 제공
            <br />
            • 커뮤니티 운영 및 관리
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            2. 처리하는 개인정보의 항목
          </Typography>
          <Typography variant="body1" paragraph>
            다음과 같은 개인정보를 처리합니다:
          </Typography>
          <Typography variant="body2" paragraph sx={{ ml: 2 }}>
            • 필수항목: 이메일, 닉네임
            <br />
            • 선택항목: 프로필 사진
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            3. 개인정보의 보유 및 이용기간
          </Typography>
          <Typography variant="body1" paragraph>
            회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            4. 개인정보의 제3자 제공
          </Typography>
          <Typography variant="body1" paragraph>
            개인정보를 제3자에게 제공하지 않습니다.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            5. 개인정보처리의 위탁
          </Typography>
          <Typography variant="body1" paragraph>
            개인정보 처리업무를 외부에 위탁하지 않습니다.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            6. 정보주체의 권리·의무 및 행사방법
          </Typography>
          <Typography variant="body1" paragraph>
            정보주체는 언제든지 개인정보 열람, 정정·삭제, 처리정지를 요구할 수 있습니다.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            7. 개인정보의 안전성 확보조치
          </Typography>
          <Typography variant="body1" paragraph>
            개인정보 보호를 위해 다음과 같은 조치를 취합니다:
          </Typography>
          <Typography variant="body2" paragraph sx={{ ml: 2 }}>
            • 개인정보 암호화
            <br />
            • 접근권한 제한
            <br />
            • 보안프로그램 설치 및 갱신
          </Typography>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            시행일자: 2024년 1월 1일
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;