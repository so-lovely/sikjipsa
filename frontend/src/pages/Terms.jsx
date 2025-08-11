import React from 'react';
import { Container, Title, Text, Paper, Stack } from '@mantine/core';

const Terms = () => {
  return (
    <Container size="md" py={50}>
      <Paper p={30} shadow="sm" radius="md">
        <Stack spacing="xl">
          <Title order={1} ta="center" c="green.7">
            이용약관
          </Title>
          
          <Stack spacing="md">
            <Title order={3} c="green.6">제1조 (목적)</Title>
            <Text>
              이 약관은 식물 커뮤니티 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </Text>

            <Title order={3} c="green.6">제2조 (정의)</Title>
            <Text>
              1. "서비스"라 함은 회사가 제공하는 식물 관련 정보 공유 및 커뮤니티 서비스를 말합니다.<br />
              2. "이용자"라 함은 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
            </Text>

            <Title order={3} c="green.6">제3조 (약관의 효력 및 변경)</Title>
            <Text>
              1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.<br />
              2. 회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
            </Text>

            <Title order={3} c="green.6">제4조 (서비스의 제공 및 변경)</Title>
            <Text>
              1. 회사는 다음과 같은 서비스를 제공합니다:<br />
              &nbsp;&nbsp;- 식물 키우기 일지 작성 및 관리<br />
              &nbsp;&nbsp;- 식물 질병 진단 서비스<br />
              &nbsp;&nbsp;- 식물 관련 정보 공유 커뮤니티<br />
              2. 회사는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경할 수 있습니다.
            </Text>

            <Title order={3} c="green.6">제5조 (이용자의 의무)</Title>
            <Text>
              1. 이용자는 다음 사항을 준수해야 합니다:<br />
              &nbsp;&nbsp;- 타인의 저작권 등 권리를 침해하지 않을 것<br />
              &nbsp;&nbsp;- 허위 정보를 게시하지 않을 것<br />
              &nbsp;&nbsp;- 다른 이용자에게 피해를 주지 않을 것<br />
              2. 이용자는 관련 법령, 이 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항을 준수해야 합니다.
            </Text>

            <Title order={3} c="green.6">제6조 (개인정보보호)</Title>
            <Text>
              회사는 이용자의 개인정보 보호를 위해 개인정보보호정책을 수립하고 이를 준수합니다.
            </Text>

            <Title order={3} c="green.6">제7조 (면책조항)</Title>
            <Text>
              1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br />
              2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
            </Text>

            <Title order={3} c="green.6">제8조 (분쟁해결)</Title>
            <Text>
              이 약관에 명시되지 않은 사항이나 해석에 관해서는 관련 법령 또는 상관례에 따릅니다.
            </Text>

            <Text size="sm" c="gray.6" ta="right">
              시행일자: 2024년 1월 1일
            </Text>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Terms;