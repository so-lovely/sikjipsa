import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ScrollArea,
  Loader
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconHeart, IconMessage, IconPlus } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { communityAPI } from '../api/community.js';

function Community() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  
  // --- 1. 상태 관리 ---
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 무한 스크롤 상태
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 새 게시글 상태 (모달 제거)

  const categories = [
    { value: 'all', label: '전체', emoji: '🌿' },
    { value: 'general', label: '일반', emoji: '📝' },
    { value: 'question', label: '질문', emoji: '❓' },
    { value: 'tip', label: '꿀팁', emoji: '💡' },
    { value: 'share', label: '자랑', emoji: '📸' },
    { value: 'trade', label: '나눔', emoji: '🤝' }
  ];



  // --- 2. 데이터 로딩 로직 ---

  // Community.jsx 내부

// 기존의 fetchPosts 함수를 아래의 새로운 loadPosts 함수로 완전히 교체하세요.
// [수정] 더 강력해진 데이터 로딩 함수
const loadPosts = useCallback(async (options = {}) => {
  const { reset = false } = options; // reset 옵션을 추가 (목록을 새로고침할지 여부)
  
  // 1. 불러올 페이지 번호 결정
  const pageToFetch = reset ? 1 : page;

  // 2. 로딩 중이거나, 더 이상 데이터가 없으면(그리고 리셋도 아니면) 중단
  if (isLoading || (!hasMore && !reset)) return;

  setIsLoading(true);
  try {
    // 3. API 호출 시, 디바운싱된 검색어와 선택된 카테고리를 함께 전달
    const responseData = await communityAPI.getPosts({
      page: pageToFetch,
      search: debouncedSearchTerm,
      category: selectedCategory,
    });

    // 4. reset 옵션에 따라 게시글 상태를 업데이트
    if (reset) {
      setPosts(responseData.posts || []); // 목록을 완전히 새로 교체
    } else {
      setPosts(prev => [...prev, ...responseData.posts]); // 기존 목록 뒤에 추가
    }

    // 5. 페이지와 hasMore 상태 업데이트
    setPage(pageToFetch + 1);
    setHasMore(responseData.currentPage < responseData.totalPages);

  } catch (err) {
    console.error('Failed to load posts:', err);
    setError('게시글을 불러오는데 실패했습니다.');
  } finally {
    setIsLoading(false);
  }
}, [isLoading, hasMore, page, debouncedSearchTerm, selectedCategory]); // 6. 의존성 배열에 debouncedSearchTerm과 selectedCategory 추가

  useEffect(() => {
  // 검색어나 카테고리가 바뀌었으므로, 목록을 리셋하고 page 1부터 다시 불러옵니다.
  setPosts([]); // 기존 게시글 목록을 비웁니다.
  setPage(1);   // 페이지 번호를 1로 리셋합니다.
  setHasMore(true); // hasMore를 다시 true로 설정합니다.
  
  // 첫 페이지 데이터를 불러옵니다.
  // setTimeout을 사용하여 상태 변경이 확실히 반영된 후 API를 호출합니다. (안정성 향상)
  setTimeout(() => {
    loadPosts({ reset: true });
  }, 0);

}, [debouncedSearchTerm, selectedCategory]); // debouncedSearchTerm이나 selectedCategory가 바뀔 때마다 이 useEffect가 실행됩니다.

  // --- 3. 스크롤 감지 로직 ---
const observer = useRef();
const lastPostElementRef = useCallback(node => {
  if (isLoading) return;
  if (observer.current) observer.current.disconnect();

  observer.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore) {
      loadPosts(); // [수정] fetchPosts() -> loadPosts()로 변경. (reset 옵션 없이 호출)
    }
  });

  if (node) observer.current.observe(node);
}, [isLoading, hasMore, loadPosts]); // [수정] fetchPosts -> loadPosts

  // --- 4. 핸들러 및 유틸리티 함수들 (이 부분은 기존 코드와 거의 동일) ---
  const handlePostClick = (postId) => {
    navigate(`/community/post/${postId}`);
  };



  // Utility functions
  const getCategoryColor = (category) => {
    const colors = { general: 'gray', question: 'blue', tip: 'green', share: 'pink', trade: 'orange' };
    return colors[category] || 'gray';
  };
  
  const getCategoryLabel = (category) => {
    const labels = { general: '일반', question: '질문', tip: '꿀팁', share: '자랑', trade: '나눔' };
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

  const cleanContent = (content) => {
    if (!content) return '';
    // Remove HTML tags and image placeholders
    return content
      .replace(/<div class="embedded-image"[^>]*>.*?<\/div>/gs, '')
      .replace(/\[이미지:\s*[^\]]*\]/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  };


  // --- 5. JSX 렌더링 ---
  return (
    <Container size="xl" py="xl">
      {/* ... Hero Section, Header Controls, Category Tabs 등 상단 UI는 그대로 ... */}
      <Stack align="center" gap="xl" mb={60}>
        <Title order={1} size={48} fw={700} ta="center" c="gray.8">
          <IconMessage size={48} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
          <Text component="span" c="green.6">커뮤니티</Text>
        </Title>
        <Text size="lg" ta="center" c="gray.6" maw={600}>
          식물 애호가들과 소통하고 경험을 나누며 
          함께 성장해보세요
        </Text>
      </Stack>
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
          onClick={() => navigate('/community/write')}
          disabled={!isLoggedIn}
          variant="gradient"
          gradient={{ from: 'green.5', to: 'green.6' }}
        >
          글쓰기
        </Button>
      </Group>
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
        {/* 🚨 이 부분이 가장 중요하게 바뀐 부분입니다! */}
        {posts.map((post, index) => {
          const postCard = (
            <Card
              key={post.id}
              shadow="sm"
              radius="md"
              padding="lg"
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              styles={{ root: { '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' } } }}
              onClick={() => handlePostClick(post.id)}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Group>
                    <Avatar src={post.user.profile_image} alt={post.user.username} size="sm" color="green">
                      {post.user.username.charAt(0)}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>{post.user.username}</Text>
                      <Text size="xs" c="dimmed">{formatDate(post.created_at)}</Text>
                    </div>
                  </Group>
                  <Badge color={getCategoryColor(post.post_type)} variant="light" size="sm">
                    {getCategoryLabel(post.post_type)}
                  </Badge>
                </Group>
                <div>
                  <Title order={3} size="lg" fw={600} mb="xs" c="gray.8">{post.title}</Title>
                  <Text size="sm" c="gray.6" lineClamp={2}>{cleanContent(post.content)}</Text>
                </div>
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
          );

          // 마지막 게시글이라면, 감시용 div로 감싸서 반환
          if (posts.length === index + 1) {
            return <div ref={lastPostElementRef} key={post.id}>{postCard}</div>;
          }
          // 아니라면 그냥 카드만 반환
          return postCard;
        })}
      </SimpleGrid>

      {/* 로딩 중일 때와 데이터가 없을 때의 UI */}
      {isLoading && (
        <Group justify="center" py="xl">
          <Loader color="green" />
        </Group>
      )}

      {/* 🚨 filteredPosts -> posts 로 변경 */}
      {posts.length === 0 && !isLoading && (
        <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="md">
            <Text size="xl">📝</Text>
            <Title order={3} c="gray.6">게시글이 없습니다</Title>
            <Text c="dimmed">첫 번째 게시글을 작성해보세요!</Text>
          </Stack>
        </Card>
      )}


      {!isLoggedIn && (
        <Card shadow="sm" radius="md" padding="lg" mt="xl" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="sm">
            <Text c="dimmed">글을 작성하려면 로그인이 필요합니다</Text>
            <Button variant="light" color="green" onClick={() => navigate('/login')}>로그인하기</Button>
          </Stack>
        </Card>
      )}
    </Container>
  );
}

export default Community;
