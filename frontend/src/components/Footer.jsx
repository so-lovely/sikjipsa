import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Group, 
  Text, 
  Stack, 
  SimpleGrid, 
  Anchor,
  Divider,
  Box
} from '@mantine/core';
import { 
  IconSeedling, 
  IconShoppingBag, 
  IconBulb, 
  IconClipboardList 
} from '@tabler/icons-react';

function Footer() {
  const footerSections = [
    {
      title: <Group gap="xs"><IconShoppingBag size={16} color="var(--mantine-color-green-4)" /> 서비스</Group>,
      links: [
        { to: '/encyclopedia', label: '식물 백과사전' },
        { to: '/diagnosis', label: 'AI 식물 진단' },
        { to: '/community', label: '커뮤니티' },
        { to: '/diary', label: '성장 일기' }
      ]
    },
    {
      title: <Group gap="xs"><IconBulb size={16} color="var(--mantine-color-green-4)" /> 고객지원</Group>,
      links: [
        { to: '/contact', label: '문의하기' },
        { to: '/announcements', label: '공지사항' }
      ]
    },
    {
      title: <Group gap="xs"><IconClipboardList size={16} color="var(--mantine-color-green-4)" /> 이용정보</Group>,
      links: [
        { to: '/terms', label: '이용약관' },
        { to: '/privacy', label: '개인정보처리방침' }
      ]
    }
  ];

  return (
    <Box
      component="footer"
      bg="gray.8"
      style={{ marginTop: 'auto' }}
    >
      <Container size="md" py={50}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {/* Brand Section */}
          <Stack>
            <Group>
              <IconSeedling size={24} color="var(--mantine-color-green-4)" />
              <Text size="lg" fw={700} c="green.4">
                식집사
              </Text>
            </Group>
            <Text size="sm" c="gray.4" lh={1.6}>
              AI 기술과 전문 지식이 결합된 스마트한 식물 관리 플랫폼으로
              건강하고 아름다운 식물 라이프를 제공합니다.
            </Text>
          </Stack>

          {/* Service Links */}
          {footerSections.map((section, index) => (
            <Stack key={index} gap="sm">
              <Text fw={700} c="green.6" size="sm">
                {section.title}
              </Text>
              <Stack gap="xs">
                {section.links.map((link, linkIndex) => (
                  <Anchor
                    key={linkIndex}
                    component={Link}
                    to={link.to}
                    c="gray.4"
                    size="sm"
                    style={{ 
                      textDecoration: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    hover={{ color: 'green.4' }}
                  >
                    {link.label}
                  </Anchor>
                ))}
              </Stack>
            </Stack>
          ))}
        </SimpleGrid>

        <Divider my="lg" color="gray.7" />
        
        <Group justify="center">
          <Text size="sm" c="gray.5" ta="center">
            &copy; 2025 식집사. All rights reserved.
          </Text>
        </Group>
      </Container>
    </Box>
  );
}

export default Footer;