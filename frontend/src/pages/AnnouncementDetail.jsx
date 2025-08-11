import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  Stack,
  Badge,
  Avatar,
  ActionIcon,
  Divider,
  Box
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPin,
  IconEye,
  IconEdit,
  IconTrash,
  IconSpeakerphone
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { announcementAPI } from '../api/announcements.js';

function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setIsLoading(true);
        const data = await announcementAPI.getAnnouncement(id);
        setAnnouncement(data.announcement);
      } catch (error) {
        console.error('Failed to load announcement:', error);
        setError('공지사항을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadAnnouncement();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await announcementAPI.deleteAnnouncement(id);
      navigate('/announcements');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('공지사항 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '알 수 없음';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
          <Text>로딩 중...</Text>
        </Card>
      </Container>
    );
  }

  if (error || !announcement) {
    return (
      <Container size="md" py="xl">
        <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Text size="xl">⚠️</Text>
            <Title order={3} c="gray.6">
              공지사항을 찾을 수 없습니다
            </Title>
            <Text c="dimmed">
              {error || '존재하지 않는 공지사항입니다.'}
            </Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate('/announcements')}
              variant="light"
            >
              목록으로 돌아가기
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      {/* Back Button */}
      <Group mb="xl">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="light"
          color="gray"
          onClick={() => navigate('/announcements')}
        >
          목록으로
        </Button>
      </Group>

      {/* Announcement Card */}
      <Card shadow="sm" radius="md" padding="xl">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <Group>
              <IconSpeakerphone size={24} color="var(--mantine-color-blue-6)" />
              {announcement.is_pinned && (
                <Badge color="blue" variant="light" size="sm">
                  <IconPin size={12} style={{ marginRight: 4 }} />
                  고정
                </Badge>
              )}
            </Group>

            {isAdmin && (
              <Group gap="xs">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={() => navigate(`/announcements/${id}/edit`)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={handleDelete}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            )}
          </Group>

          {/* Title */}
          <Title order={1} size="h2" fw={700} c="gray.8">
            {announcement.title}
          </Title>

          {/* Author Info */}
          <Group gap="sm">
            <Avatar
              src={announcement.author?.profile_image}
              alt={announcement.author?.username || 'Admin'}
              size="sm"
              color="blue"
            >
              {(announcement.author?.username || 'Admin').charAt(0)}
            </Avatar>
            <div>
              <Text size="sm" fw={500}>
                {announcement.author?.username || 'Administrator'}
              </Text>
              <Text size="xs" c="dimmed">
                {formatDate(announcement.created_at)}
              </Text>
            </div>
            <Box ml="auto">
              <Group gap="xs" align="center">
                <IconEye size={14} color="var(--mantine-color-gray-5)" />
                <Text size="xs" c="dimmed">조회 {announcement.view_count || 0}</Text>
              </Group>
            </Box>
          </Group>

          <Divider />

          {/* Content */}
          <Box>
            <Text
              size="md"
              style={{
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {announcement.content}
            </Text>
          </Box>

          <Divider />

          {/* Footer */}
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              최종 수정: {formatDate(announcement.updated_at)}
            </Text>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="light"
              onClick={() => navigate('/announcements')}
            >
              목록으로
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}

export default AnnouncementDetail;