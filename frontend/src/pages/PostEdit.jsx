import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Card,
  Stack,
  Alert,
  Box,
  Center,
  Loader,
  rem
} from '@mantine/core';
import { IconAlertCircle, IconEdit, IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import TiptapEditor from '../components/TiptapEditor';
import apiClient from '../api/client';

function PostEdit() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // 기존 게시글 데이터 로드 (수정 모드인 경우)
    const loadPostData = async () => {
      if (postId) {
        try {
          setIsLoading(true);
          const response = await apiClient.get(`/community/posts/${postId}`);
          const postData = response.data;
          setFormData({
            title: postData.title || '',
            content: postData.content || ''
          });
        } catch (error) {
          console.error('Error loading post data:', error);
          setError('게시글 데이터를 불러오는데 실패했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPostData();
  }, [isLoggedIn, navigate, postId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const postData = {
        title: formData.title,
        content: formData.content
      };
      
      if (postId) {
        // 수정 모드
        await apiClient.put(`/community/posts/${postId}`, postData);
      } else {
        // 새 게시글 생성 모드
        await apiClient.post('/community/posts', postData);
      }
      
      // 성공 시 커뮤니티 페이지로 이동
      navigate('/community');
    } catch (error) {
      console.error('Error saving post:', error);
      setError('게시글 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Container size="md" py={50}>
      {/* Hero Section */}
      <Stack align="center" gap="lg" mb={40}>
        <Group gap="md" align="center">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            뒤로가기
          </Button>
        </Group>
        <Title order={1} ta="center" c="blue.7" fw={700}>
          {postId ? '게시글 수정' : '게시글 작성'}
        </Title>
        <Text size="md" ta="center" c="gray.6" maw={500}>
          {postId ? '게시글을 수정해보세요' : '새로운 게시글을 작성해보세요'}
        </Text>
      </Stack>

      <Card shadow="sm" radius="md" p={30}>
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="오류 발생"
            color="red"
            mb="xl"
            variant="light"
          >
            {error}
          </Alert>
        )}
        
        {isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader color="blue" size="lg" />
              <Text size="lg" fw={600} c="gray.7">
                {postId ? '게시글을 수정하고 있습니다...' : '게시글을 작성하고 있습니다...'}
              </Text>
            </Stack>
          </Center>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack spacing="xl">
              <TextInput
                label="제목"
                placeholder="게시글 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                leftSection={<IconEdit size={16} />}
              />

              {/* Tiptap Editor */}
              <Box>
                <Text size="sm" fw={500} mb="xs">내용</Text>
                <Box style={{ 
                  border: '0.0625rem solid #e5e7eb',
                  borderRadius: 'var(--mantine-radius-md)',
                  overflow: 'hidden',
                  height: '25rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <TiptapEditor
                    content={formData.content}
                    onChange={handleContentChange}
                  />
                </Box>
              </Box>

              {/* 액션 버튼 */}
              <Group justify="flex-end" gap="md">
                <Button
                  variant="light"
                  color="gray"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  gradient={{ from: 'blue.5', to: 'blue.6' }}
                  disabled={isLoading}
                  leftSection={isLoading ? <Loader size={16} /> : '✨'}
                >
                  {isLoading ? 
                    (postId ? '수정 중...' : '작성 중...') : 
                    (postId ? '게시글 수정' : '게시글 작성')
                  }
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Card>
    </Container>
  );
}

export default PostEdit;