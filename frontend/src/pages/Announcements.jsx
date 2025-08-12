import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Card,
  Stack,
  Badge,
  Avatar,
  Modal,
  Textarea,
  Switch
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconSearch, 
  IconSpeakerphone, 
  IconPlus, 
  IconSend, 
  IconPin,
  IconEye,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { announcementAPI } from '../api/announcements.js';

function Announcements() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: '', 
    content: '', 
    is_pinned: false, 
    is_published: true 
  });

  // 관리자 여부 확인 (임시로 user.role이 'admin'인지 확인)
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        setIsLoading(true);
        const data = await announcementAPI.getAnnouncements();
        setAnnouncements(data.announcements || []);
      } catch (error) {
        console.error('Failed to load announcements:', error);
        setError('공지사항을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAnnouncementClick = (announcementId) => {
    navigate(`/announcements/${announcementId}`);
  };

  const handleSubmitAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

    try {
      const createdAnnouncement = await announcementAPI.createAnnouncement(newAnnouncement);
      setAnnouncements(prev => [createdAnnouncement.announcement, ...prev]);
      setNewAnnouncement({ title: '', content: '', is_pinned: false, is_published: true });
      close();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('공지사항 작성에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '알 수 없음';
    
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <Container size="xl" py="xl">
      {/* Hero Section */}
      <Stack align="center" gap="xl" mb={60}>
        <Title order={1} size={48} fw={700} ta="center" c="gray.8">
          <IconSpeakerphone size={48} color="var(--mantine-color-blue-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
          <Text component="span" c="blue.6">공지사항</Text>
        </Title>
        <Text size="lg" ta="center" c="gray.6" maw={600}>
          중요한 소식과 업데이트 정보를 확인하세요
        </Text>
      </Stack>

      {/* Header Controls */}
      <Group justify="space-between" mb="xl">
        <TextInput
          placeholder="공지사항 검색..."
          leftSection={<IconSearch size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maw={300}
        />

        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={open}
            variant="gradient"
            gradient={{ from: 'blue.5', to: 'blue.6' }}
          >
            공지사항 작성
          </Button>
        )}
      </Group>

      {/* Error Message */}
      {error && (
        <Card shadow="sm" radius="md" padding="lg" mb="xl" style={{ backgroundColor: '#fff5f5' }}>
          <Text c="red" ta="center">{error}</Text>
        </Card>
      )}

      {/* Announcements List */}
      <Stack gap="md">
        {filteredAnnouncements.map((announcement) => (
          <Card
            key={announcement.id}
            shadow="sm"
            radius="md"
            padding="lg"
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: announcement.is_pinned ? '2px solid var(--mantine-color-blue-3)' : undefined
            }}
            styles={{
              root: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }
              }
            }}
            onClick={() => handleAnnouncementClick(announcement.id)}
          >
            <Stack gap="sm">
              {/* Announcement Header */}
              <Group justify="space-between" align="flex-start">
                <Group>
                  <Avatar 
                    src={announcement.author?.profile_image}
                    alt={announcement.author?.username || 'Admin'}
                    size="sm"
                    color="blue"
                  >
                    {(announcement.author?.username || 'Admin').charAt(0)}
                  </Avatar>
                  <div>
                    <Group gap="xs" align="center">
                      <Text size="sm" fw={500}>
                        {announcement.author?.username || 'Administrator'}
                      </Text>
                      {announcement.is_pinned && (
                        <IconPin size={14} color="var(--mantine-color-blue-6)" />
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {formatDate(announcement.created_at)}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  {announcement.is_pinned && (
                    <Badge color="blue" variant="light" size="sm">
                      고정
                    </Badge>
                  )}
                  <Group gap="xs" align="center">
                    <IconEye size={14} color="var(--mantine-color-gray-5)" />
                    <Text size="xs" c="dimmed">{announcement.view_count || 0}</Text>
                  </Group>
                </Group>
              </Group>

              {/* Announcement Content */}
              <div>
                <Title order={3} size="lg" fw={600} mb="xs" c="gray.8">
                  {announcement.title}
                </Title>
                <Text size="sm" c="gray.6" lineClamp={2}>
                  {announcement.content}
                </Text>
              </div>
            </Stack>
          </Card>
        ))}
      </Stack>

      {filteredAnnouncements.length === 0 && !isLoading && (
        <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Text size="xl">📢</Text>
            <Title order={3} c="gray.6">
              공지사항이 없습니다
            </Title>
            <Text c="dimmed">
              아직 등록된 공지사항이 없습니다.
            </Text>
          </Stack>
        </Card>
      )}

      {/* Write Announcement Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} c="gray.8">
            새 공지사항 작성
          </Title>
        }
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="제목"
            placeholder="공지사항 제목을 입력하세요..."
            value={newAnnouncement.title}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <Textarea
            label="내용"
            placeholder="공지사항 내용을 입력하세요..."
            minRows={8}
            value={newAnnouncement.content}
            onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
            required
          />

          <Group>
            <Switch
              label="상단 고정"
              description="중요한 공지사항을 목록 상단에 고정합니다"
              checked={newAnnouncement.is_pinned}
              onChange={(event) => setNewAnnouncement(prev => ({ 
                ...prev, 
                is_pinned: event.currentTarget.checked 
              }))}
            />
            <Switch
              label="즉시 게시"
              description="작성 즉시 공개합니다"
              checked={newAnnouncement.is_published}
              onChange={(event) => setNewAnnouncement(prev => ({ 
                ...prev, 
                is_published: event.currentTarget.checked 
              }))}
            />
          </Group>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={close}>
              취소
            </Button>
            <Button
              leftSection={<IconSend size={16} />}
              onClick={handleSubmitAnnouncement}
              disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
              variant="gradient"
              gradient={{ from: 'blue.5', to: 'blue.6' }}
            >
              게시하기
            </Button>
          </Group>
        </Stack>
      </Modal>

      {!isAdmin && isLoggedIn && (
        <Card shadow="sm" radius="md" padding="lg" mt="xl" style={{ textAlign: 'center' }}>
          <Text c="dimmed" size="sm">
            공지사항 작성은 관리자만 가능합니다.
          </Text>
        </Card>
      )}
    </Container>
  );
}

export default Announcements;