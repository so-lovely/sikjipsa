import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Alert,
  Box,
  Center,
  Loader,
  Select,
  ActionIcon
} from '@mantine/core';
import { IconAlertCircle, IconPencil } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import TiptapEditor from '../components/TiptapEditor';
import apiClient from '../api/client';

function PostEdit() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'question', label: '질문' },
    { value: 'tip', label: '꿀팁' },
    { value: 'share', label: '자랑' },
    { value: 'trade', label: '나눔' },
  ];

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
            content: postData.content || '',
            category: postData.post_type || ''
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

    if (!formData.category) {
      setError('카테고리를 선택해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        post_type: formData.category
      };

      console.log('Sending post data:', postData);
      
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
      console.error('Error details:', error.response?.data);
      setError(`게시글 저장에 실패했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Container 
      size="xl" 
      style={{ 
        height: '100vh',
        display: 'flex', 
        flexDirection: 'column',
        padding: 'clamp(1rem, 4vw, 3rem) clamp(1rem, 5vw, 3rem)'
      }}
    >
      {/* Header with centered pencil icon */}
      <Box mb="xl">
        <Group justify="center" gap="sm">
          <ActionIcon
            variant="filled"
            size="xl"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, #A9E5C4 0%, #79D1A0 100%)',
              color: 'white',
              boxShadow: 'var(--shadow-md)',
              border: 'none'
            }}
          >
            <IconPencil size="1.5rem" stroke={2} />
          </ActionIcon>
          <Text 
            size="xl" 
            fw={700} 
            c="var(--charcoal)"
            style={{ 
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.5px'
            }}
          >
            {postId ? 'Edit Post' : 'New Post'}
          </Text>
        </Group>
      </Box>
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
            <Loader color="green" size="lg" />
            <Text size="lg" fw={600} c="gray.7">
              {postId ? '게시글을 수정하고 있습니다...' : '게시글을 작성하고 있습니다...'}
            </Text>
          </Stack>
        </Center>
      ) : (
        <>
          {/* Form fields */}
          <Stack gap="lg" mb="xl">
            <Group grow>
              <Select
                label="카테고리"
                placeholder="카테고리를 선택하세요"
                data={categories}
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                size="md"
                radius="lg"
                required
              />
            </Group>
            
            <TextInput
              label="제목"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              size="md"
              radius="lg"
              required
            />
          </Stack>

          {/* Editor container with flex: 1 */}
          <Box 
            style={{ 
              flex: 1, 
              height: 'calc(100vh - clamp(17.5rem, 25vh, 22rem))',
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0,
              border: '0.125rem solid #d1d5db',
              borderRadius: '1rem',
              overflow: 'hidden',
              backgroundColor: '#fff'
            }}
          >
            <TiptapEditor 
              content={formData.content} 
              onChange={handleContentChange} 
            />
          </Box>

          {/* Action buttons */}
          <Group justify="flex-end" gap="md" pt="lg">
            <Button
              variant="gradient"
              gradient={{ from: 'green.5', to: 'green.6' }}
              size="md"
              radius="lg"
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.category || !formData.content.trim() || isLoading}
              loading={isLoading}
            >
              {isLoading ? 
                (postId ? '수정하는 중...' : '게시하는 중...') : 
                (postId ? '수정하기' : '게시하기')
              }
            </Button>
          </Group>
        </>
      )}
    </Container>
  );
}

export default PostEdit;