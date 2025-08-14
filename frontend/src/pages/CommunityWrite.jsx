import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Group, ActionIcon, Text, TextInput, Select, Stack, Button } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import TiptapEditor from '../components/TiptapEditor';
import { communityAPI } from '../api/community';
import { useAuth } from '../context/AuthContext';

const PostEditor = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'question', label: '질문' },
    { value: 'tip', label: '꿀팁' },
    { value: 'share', label: '자랑' },
    { value: 'trade', label: '나눔' },
  ];

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const postData = {
        title: title.trim(),
        content: content,
        post_type: category
      };
      
      await communityAPI.createPost(postData);
      alert('게시글이 성공적으로 작성되었습니다!');
      navigate('/community');
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      alert('게시글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };


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
              background: 'linear-gradient(135deg, #CCF4DE 0%, #99E9BF 100%)',
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
            New Post
          </Text>
        </Group>
      </Box>

      {/* Form fields */}
      <Stack gap="lg" mb="xl">
        <Group grow>
          <Select
            label="카테고리"
            placeholder="카테고리를 선택하세요"
            data={categories}
            value={category}
            onChange={setCategory}
            size="md"
            radius="lg"
            required
          />
        </Group>
        
        <TextInput
          label="제목"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          content={content} 
          onChange={setContent} 
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
          disabled={!title.trim() || !category || !content.trim() || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? '게시하는 중...' : '게시하기'}
        </Button>
      </Group>
    </Container>
  );
};

export default PostEditor;