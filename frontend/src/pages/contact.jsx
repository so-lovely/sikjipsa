import React from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Anchor,
  Divider,
  Accordion,
  ThemeIcon,
  rem,
} from '@mantine/core';
import { IconMail, IconPlus } from '@tabler/icons-react';

const faqItems = [
  {
    value: 'ai-diagnosis',
    question: 'AI 식물 건강 진단은 어떻게 사용하나요?',
    answer:
      "'AI 진단' 페이지에서 식물 사진을 업로드하시면, AI가 병충해나 영양 상태를 분석해 알려드립니다. 선명하고 밝은 환경에서 식물 전체 또는 아픈 부위가 잘 보이도록 촬영해 주세요.",
  },
  {
    value: 'community-post',
    question: '커뮤니티에 글을 쓰고 싶어요.',
    answer:
      "로그인 후 '커뮤니티' 페이지 우측 상단의 '글쓰기' 버튼을 눌러 새로운 게시물을 작성할 수 있습니다. 여러분의 반려 식물 이야기를 자유롭게 공유해 주세요.",
  },
  {
    value: 'partnership',
    question: '제휴 또는 광고 문의는 어떻게 하나요?',
    answer:
      '제휴 및 광고 관련 문의는 페이지 상단에 안내된 이메일로 제안서를 보내주시면, 담당자 검토 후 연락드리겠습니다.',
  },
  {
    value: 'encyclopedia',
    question: '백과사전에 제안하고싶어요',
    answer:
    '백과사전 식물 추가, 내용 정정 등은 이메일로 가급적 근거나 출처를 같이 적어 보내주세요.'
  },
  {
    value: 'error',
    question: '오류가 발생했어요',
    answer:
    '이메일로 오류 발생한 사진 또는 내용 설명 등 정보를 제공해주시면 사려깊게 검토 후 해결하도록 노력하겠습니다.'
  }

];

function ContactPage() {
  const contactEmail = "contact@sikjipsa.com"; // 실제 사용할 이메일 주소로 변경

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* --- 문의 섹션 --- */}
        <Paper withBorder radius="lg" p="xl">
          <Stack align="center" gap="lg">
            <ThemeIcon size={rem(60)} radius="xl" variant="light" color="green">
              <IconMail style={{ width: '60%', height: '60%' }} />
            </ThemeIcon>

            <Stack align="center" gap="xs">
              <Title order={2} ta="center">
                무엇을 도와드릴까요?
              </Title>
              <Text size="md" c="dimmed" ta="center">
                서비스 이용 중 궁금한 점이나 불편한 점이 있다면 언제든지 알려주세요.
              </Text>
            </Stack>

            <Anchor
              href={`mailto:${contactEmail}`}
              size="lg"
              fw={700}
              c="green.7"
              mt="sm"
            >
              {contactEmail}
            </Anchor>
            <Text size="sm" c="dimmed">
              (평일 10:00 - 18:00)
            </Text>
          </Stack>
        </Paper>

        <Divider
          label="자주 묻는 질문 (FAQ)"
          labelPosition="center"
          my="lg"
        />

        {/* --- FAQ 섹션 --- */}
        <Accordion
          variant="separated"
          radius="lg"
          chevronPosition="left"
          chevron={<IconPlus size={16} />}
          styles={{
            chevron: {
              '&[data-rotate]': {
                transform: 'rotate(45deg)',
              },
            },
          }}
        >
          {faqItems.map((item) => (
            <Accordion.Item key={item.value} value={item.value}>
              <Accordion.Control>
                <Text fw={500}>{item.question}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Text c="dimmed">{item.answer}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </Container>
  );
}

export default ContactPage;