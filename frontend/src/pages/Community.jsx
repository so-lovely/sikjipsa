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
  SimpleGrid,
  Box,
  Stack,
  Badge,
  Avatar,
  Modal,
  Textarea,
  ScrollArea,
  ActionIcon,
  Divider,
  Select,
  FileInput,
  Image
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconHeart, IconMessage, IconPlus, IconSend, IconPhoto, IconX } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { communityAPI } from '../api/community.js';

function Community() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const categories = [
    { value: 'all', label: '전체', emoji: '🌿' },
    { value: 'general', label: '일반', emoji: '📝' },
    { value: 'question', label: '질문', emoji: '❓' },
    { value: 'tip', label: '꿀팁', emoji: '💡' },
    { value: 'share', label: '자랑', emoji: '📸' },
    { value: 'trade', label: '나눔', emoji: '🤝' }
  ];

  const categoryOptions = [
    { value: 'general', label: '일반' },
    { value: 'question', label: '질문' },
    { value: 'tip', label: '꿀팁' },
    { value: 'share', label: '자랑' },
    { value: 'trade', label: '나눔' }
  ];

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const data = await communityAPI.getPosts();
        setPosts(data);
      } catch (error) {
        console.error('Failed to load posts:', error);
        setError('게시글을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.post_type === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePostClick = (postId) => {
    navigate(`/community/post/${postId}`);
  };

  const handleSubmitPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      const createdPost = await communityAPI.createPost(newPost, imageFiles);
      setPosts(prev => [createdPost, ...prev]);
      setNewPost({ title: '', content: '', category: 'general' });
      setSelectedImages([]);
      setImageFiles([]);
      close();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('게시글 작성에 실패했습니다.');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'gray',
      question: 'blue',
      tip: 'green',
      share: 'pink',
      trade: 'orange'
    };
    return colors[category] || 'gray';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      general: '일반',
      question: '질문',
      tip: '꿀팁',
      share: '자랑',
      trade: '나눔'
    };
    return labels[category] || category;
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

  const handleImageSelect = (files) => {
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files).slice(0, 5 - selectedImages.length);
    const newImageFiles = [];
    const newSelectedImages = [];
    
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newSelectedImages.push({
            id: Date.now() + Math.random(),
            url: e.target.result,
            file: file
          });
          
          if (newSelectedImages.length === newFiles.length) {
            setSelectedImages(prev => [...prev, ...newSelectedImages]);
            setImageFiles(prev => [...prev, ...newFiles.map(f => ({ file: f }))]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
    setImageFiles(prev => prev.filter((_, index) => {
      const imgIndex = selectedImages.findIndex(img => img.id === imageId);
      return index !== imgIndex;
    }));
  };

  return (
    <Container size="xl" py="xl">
      {/* Hero Section */}
      <Stack align="center" gap="xl" mb={60}>
        <Title order={1} size={48} fw={700} ta="center" c="gray.8">
          <IconMessage size={48} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
          <Text component="span" c="green.6">커뮤니티</Text>
        </Title>
        <Text size="lg" ta="center" c="gray.6" maw={600}>
          전국의 식물 애호가들과 소통하고 경험을 나누며 
          함께 성장해보세요
        </Text>
      </Stack>

      {/* Header Controls */}
      <Group justify="space-between" mb="xl">
        <Group>
          <TextInput
            placeholder="게시글 검색..."
            leftSection={<IconSearch size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maw={300}
          />
        </Group>

        <Button
          leftSection={<IconPlus size={16} />}
          onClick={open}
          disabled={!isLoggedIn}
          variant="gradient"
          gradient={{ from: 'green.5', to: 'green.6' }}
        >
          글쓰기
        </Button>
      </Group>

      {/* Category Tabs */}
      <ScrollArea type="never" mb="xl">
        <Group gap="xs" style={{ minWidth: 'max-content' }}>
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'filled' : 'light'}
              color="green"
              size="sm"
              leftSection={category.emoji}
              onClick={() => setSelectedCategory(category.value)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {category.label}
            </Button>
          ))}
        </Group>
      </ScrollArea>

      {/* Posts Grid */}
      <SimpleGrid cols={1} spacing="md">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            shadow="sm"
            radius="md"
            padding="lg"
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            styles={{
              root: {
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }
              }
            }}
            onClick={() => handlePostClick(post.id)}
          >
            <Stack gap="sm">
              {/* Post Header */}
              <Group justify="space-between" align="flex-start">
                <Group>
                  <Avatar 
                    src={post.user.profile_image}
                    alt={post.user.username}
                    size="sm"
                    color="green"
                  >
                    {post.user.username.charAt(0)}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={500}>
                      {post.user.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(post.created_at)}
                    </Text>
                  </div>
                </Group>
                <Badge
                  color={getCategoryColor(post.post_type)}
                  variant="light"
                  size="sm"
                >
                  {getCategoryLabel(post.post_type)}
                </Badge>
              </Group>

              {/* Post Content */}
              <div>
                <Title order={3} size="lg" fw={600} mb="xs" c="gray.8">
                  {post.title}
                </Title>
                <Text size="sm" c="gray.6" lineClamp={2}>
                  {post.content}
                </Text>
              </div>

              {/* Post Stats */}
              <Group gap="lg" justify="flex-start">
                <Group gap="xs">
                  <IconHeart size={16} color="var(--mantine-color-red-5)" />
                  <Text size="sm" c="dimmed">{post.likes_count || 0}</Text>
                </Group>
                <Group gap="xs">
                  <IconMessage size={16} color="var(--mantine-color-blue-5)" />
                  <Text size="sm" c="dimmed">{post.comments?.length || 0}</Text>
                </Group>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {filteredPosts.length === 0 && !isLoading && (
        <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Text size="xl">📝</Text>
            <Title order={3} c="gray.6">
              게시글이 없습니다
            </Title>
            <Text c="dimmed">
              첫 번째 게시글을 작성해보세요!
            </Text>
          </Stack>
        </Card>
      )}

      {/* Write Post Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Title order={3} c="gray.8">
            새 게시글 작성
          </Title>
        }
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="제목"
            placeholder="게시글 제목을 입력하세요..."
            value={newPost.title}
            onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <Select
            label="카테고리"
            placeholder="카테고리를 선택하세요"
            value={newPost.category}
            onChange={(value) => setNewPost(prev => ({ ...prev, category: value }))}
            data={categoryOptions}
            required
          />

          <Textarea
            label="내용"
            placeholder="내용을 입력하세요..."
            minRows={6}
            value={newPost.content}
            onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
            required
          />

          <div>
            <Text size="sm" fw={500} mb="xs">이미지 첨부 (최대 5개)</Text>
            <FileInput
              placeholder="이미지를 선택하세요..."
              leftSection={<IconPhoto size={16} />}
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={selectedImages.length >= 5}
            />
            
            {selectedImages.length > 0 && (
              <SimpleGrid cols={3} spacing="xs" mt="sm">
                {selectedImages.map((image) => (
                  <Box key={image.id} pos="relative">
                    <Image
                      src={image.url}
                      alt="Preview"
                      radius="sm"
                      h={80}
                      fit="cover"
                    />
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="filled"
                      pos="absolute"
                      top={4}
                      right={4}
                      onClick={() => removeImage(image.id)}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </div>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={close}>
              취소
            </Button>
            <Button
              leftSection={<IconSend size={16} />}
              onClick={handleSubmitPost}
              disabled={!newPost.title.trim() || !newPost.content.trim()}
              variant="gradient"
              gradient={{ from: 'green.5', to: 'green.6' }}
            >
              게시하기
            </Button>
          </Group>
        </Stack>
      </Modal>

      {!isLoggedIn && (
        <Card shadow="sm" radius="md" padding="lg" mt="xl" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="sm">
            <Text c="dimmed">
              글을 작성하려면 로그인이 필요합니다
            </Text>
            <Button
              variant="light"
              color="green"
              onClick={() => navigate('/login')}
            >
              로그인하기
            </Button>
          </Stack>
        </Card>
      )}
    </Container>
  );
}

export default Community;