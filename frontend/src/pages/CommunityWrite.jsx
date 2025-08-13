import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Card,
  Select,
  Textarea,
  FileInput,
  Image,
  ActionIcon,
  Box,
  SimpleGrid,
  Loader
} from '@mantine/core';
import { IconPlus, IconPhoto, IconX, IconSend, IconPencilPlus } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { communityAPI } from '../api/community.js';

const categories = [
  { value: 'general', label: '일반' },
  { value: 'question', label: '질문' },
  { value: 'tip', label: '꿀팁' },
  { value: 'share', label: '자랑' },
  { value: 'trade', label: '나눔' },
];

function CommunityWrite() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const contentRef = useRef(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  // Redirect if not logged in
  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleClose = () => {
    navigate('/community');
  };

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 10)); // 최대 10개
  };

  const removeImage = (imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // URL 정리
      const removed = prev.find(img => img.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const insertImageAtCursor = (image) => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const imageTag = `\n[이미지:${image.id}]\n`;
    const newText = text.substring(0, start) + imageTag + text.substring(end);
    
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(start + imageTag.length, start + imageTag.length);
    
    // Trigger change event for react-hook-form
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
  };

  const onFormSubmit = async (data) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const authorName = user?.username || user?.name;
      
      if (!authorName) {
        alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        setIsSubmitting(false);
        return;
      }
      
      const formData = {
        ...data,
        post_type: data.category,
        images: images,
        author: authorName,
      };
      
      console.log('Submitting form data:', formData);
      await communityAPI.createPost(formData, images);
      navigate('/community');
    } catch (error) {
      console.error('글 작성 실패:', error);
      alert('글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Stack gap="xl" style={{ flex: 1}}>
        <Title 
          order={1} 
          ta="center" 
          style={{
            fontSize: 'clamp(40px, 5vw, 48px)',
            fontWeight: 700,
            color: 'var(--charcoal)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)'
          }}
        >
          <IconPencilPlus size={40} style={{color: 'var(--primary-600)'}} />
          새 글 작성
        </Title>
        <Text 
          ta="center" 
          size="lg" 
          style={{ 
            maxWidth: 600, 
            color: 'var(--muted)',
            fontSize: '18px',
            lineHeight: '1.6'
          }}
        >
          식물에 관한 이야기를 자유롭게 나누어보세요. 
          이미지를 원하는 위치에 삽입할 수 있습니다.
        </Text>
      </Stack>

      {/* Write Form */}
      <Card 
        shadow="var(--shadow-md)" 
        radius="var(--radius-lg)" 
        p={0} 
        style={{ 
          overflow: 'hidden',
          border: '1px solid rgba(15, 23, 36, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: 'min(80vh, 1000px)'

        }}
      >
        {/* Form Header */}
        <Box p="xl" style={{ 
          borderBottom: '1px solid rgba(15, 23, 36, 0.08)', 
          backgroundColor: 'var(--surface)' 
        }}>
          <Title 
            order={3} 
            m={0}
            style={{
              color: 'var(--charcoal)',
              fontWeight: 600
            }}
          >
            게시글 정보
          </Title>
        </Box>

        {/* Form Body */}
        <Box p="xl" style={{ flex: 1, overflow: 'auto'}}>
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <Stack gap="xl">
              {/* Category Selection */}
              <div>
                <Text size="sm" fw={500} mb="xs" c="gray.7">카테고리</Text>
                <Select
                  placeholder="카테고리를 선택하세요"
                  data={categories}
                  {...register('category', { required: '카테고리를 선택해주세요' })}
                  error={errors.category?.message}
                  size="md"
                  radius="lg"
                />
              </div>

              {/* Title Input */}
              <div>
                <Text size="sm" fw={500} mb="xs" c="gray.7">제목</Text>
                <TextInput
                  placeholder="제목을 입력하세요"
                  {...register('title', {
                    required: '제목을 입력해주세요',
                    minLength: {
                      value: 2,
                      message: '제목은 최소 2글자 이상이어야 합니다'
                    },
                    maxLength: {
                      value: 100,
                      message: '제목은 100글자를 초과할 수 없습니다'
                    }
                  })}
                  error={errors.title?.message}
                  size="md"
                  radius="lg"
                />
              </div>

              {/* Image Upload */}
              <div>
                <Text size="sm" fw={500} mb="xs" c="gray.7">이미지 첨부 (선택사항)</Text>
                <FileInput
                  placeholder="클릭하거나 드래그하여 이미지 업로드"
                  leftSection={<IconPhoto size={16} />}
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  disabled={images.length >= 10}
                  size="md"
                  radius="lg"
                  style={{
                    border: '2px dashed var(--mantine-color-gray-3)',
                    backgroundColor: images.length > 0 ? 'var(--mantine-color-green-0)' : 'transparent'
                  }}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  JPG, PNG 파일만 가능, 최대 10개
                </Text>

                {/* Image Preview */}
                {images.length > 0 && (
                  <SimpleGrid cols={5} spacing="sm" mt="md">
                    {images.map(image => (
                      <Box key={image.id} pos="relative">
                        <Image
                          src={image.preview}
                          alt="미리보기"
                          radius="lg"
                          h={80}
                          fit="cover"
                          style={{ cursor: 'pointer' }}
                          onClick={() => insertImageAtCursor(image)}
                          title="클릭하여 내용에 삽입"
                        />
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="filled"
                          pos="absolute"
                          top={4}
                          right={4}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </div>

              {/* Content Editor */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column'}}>
                <Text size="sm" fw={500} mb="xs" c="gray.7">내용</Text>
                <Textarea
                  ref={contentRef}
                  placeholder="
💡 이미지 업로드 팁:
- 이미지를 드래그해서 원하는 곳에 놓을 수 있습니다
- 텍스트와 이미지를 자유롭게 배치하여 풍부한 내용을 작성해보세요"
                  {...register('content', {
                    required: '내용을 입력해주세요'
                  })}
                  error={errors.content?.message}
                  minRows={32}
                  size="md"
                  radius="lg"
                  style={{ 
                    height: '100%',
                    minHeight: 'auto',
                    maxHeight: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </Stack>

            {/* Form Footer */}
            <Box
              p="xl"
              style={{
                borderTop: '1px solid rgba(15, 23, 36, 0.08)',
                backgroundColor: 'var(--surface)',
                marginTop: 'var(--space-xl)'
              }}
            >
              <Group justify="flex-end" gap="md">
                <Button
                  variant="light"
                  onClick={handleClose}
                  size="md"
                  radius="lg"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  leftSection={<IconSend size={16} />}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  variant="gradient"
                  gradient={{ from: 'green.5', to: 'green.6' }}
                  size="md"
                  radius="lg"
                  style={{ 
                    pointerEvents: isSubmitting ? 'none' : 'auto' 
                  }}
                >
                  {isSubmitting ? '게시하는 중...' : '게시하기'}
                </Button>
              </Group>
            </Box>
          </form>
        </Box>
      </Card>
    </Container>
  );
}

export default CommunityWrite;
