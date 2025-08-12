import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Modal,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Select,
  Textarea,
  FileInput,
  Image,
  ActionIcon,
  Box,
  SimpleGrid,
  Text as MantineText
} from '@mantine/core';
import { IconPhoto, IconX, IconSend } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';

const categories = [
  { value: '질문답변', label: '질문답변' },
  { value: '자랑하기', label: '자랑하기' },
  { value: '정보공유', label: '정보공유' },
  { value: '팁공유', label: '팁공유' },
  { value: '추천요청', label: '추천요청' },
];

function WritePostModal({ isOpen, onClose, onSubmit }) {
  const { user, isLoggedIn } = useAuth();
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const handleClose = () => {
    reset();
    setImages([]);
    onClose();
  };

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // 최대 5개
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

  const onFormSubmit = async (data) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions
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
        post_type: data.category,  // category를 post_type으로 매핑
        images: images,
        author: authorName,
      };
      console.log('Submitting form data:', formData);
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('글 작성 실패:', error);
      alert('글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      opened={isOpen} 
      onClose={handleClose} 
      title={<Title order={3} c="gray.8">✏️ 새 글 작성</Title>}
      size="lg" 
      centered
      radius="xl"
      styles={{
        header: { borderBottom: '1px solid var(--mantine-color-gray-2)' },
        body: { padding: 'var(--mantine-spacing-xl)' }
      }}
    >
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Stack gap="xl">
          {/* Category Selection */}
          <div>
            <MantineText size="sm" fw={500} mb="xs" c="gray.7">카테고리</MantineText>
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
            <MantineText size="sm" fw={500} mb="xs" c="gray.7">제목</MantineText>
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

          {/* Content Input */}
          <div>
            <MantineText size="sm" fw={500} mb="xs" c="gray.7">내용</MantineText>
            <Textarea
              placeholder="식물에 관한 이야기를 자유롭게 나누어보세요..."
              {...register('content', {
                required: '내용을 입력해주세요',
                minLength: {
                  value: 10,
                  message: '내용은 최소 10글자 이상이어야 합니다'
                }
              })}
              error={errors.content?.message}
              minRows={6}
              size="md"
              radius="lg"
            />
          </div>

          {/* Image Upload */}
          <div>
            <MantineText size="sm" fw={500} mb="xs" c="gray.7">이미지 첨부 (선택사항)</MantineText>
            <FileInput
              placeholder="클릭하거나 드래그하여 이미지 업로드"
              leftSection={<IconPhoto size={16} />}
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={images.length >= 5}
              size="md"
              radius="lg"
              style={{
                border: '2px dashed var(--mantine-color-gray-3)',
                backgroundColor: images.length > 0 ? 'var(--mantine-color-green-0)' : 'transparent'
              }}
            />
            <MantineText size="xs" c="dimmed" mt="xs">
              JPG, PNG 파일만 가능, 최대 5개
            </MantineText>

            {/* Image Preview */}
            {images.length > 0 && (
              <SimpleGrid cols={3} spacing="sm" mt="md">
                {images.map(image => (
                  <Box key={image.id} pos="relative">
                    <Image
                      src={image.preview}
                      alt="미리보기"
                      radius="lg"
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

          {/* Form Actions */}
          <Group justify="flex-end" gap="md" pt="md">
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
        </Stack>
      </form>
    </Modal>
  );
}

export default WritePostModal;