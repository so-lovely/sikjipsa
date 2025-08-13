import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
  FileInput,
  Image,
  ActionIcon,
  Box,
  SimpleGrid,
} from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { IconPencilPlus, IconPhoto, IconX, IconSend } from '@tabler/icons-react';
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
  const [draggedImage, setDraggedImage] = useState(null);
  
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: '',
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm();

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
      id: Math.random().toString(36).substring(2, 11)
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  };

  const removeImage = (imageId) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const insertImageIntoEditor = (image) => {
    if (!editor) return;
    
    const imageTag = `<div class="embedded-image" data-image-id="${image.id}" style="margin: 16px 0; text-align: center; border: 2px dashed #e9ecef; border-radius: 8px; padding: 16px;"><img src="${image.preview}" alt="Uploaded image" style="max-width: 100%; height: auto; border-radius: 4px;" /><p style="margin: 8px 0 0; font-size: 14px; color: #868e96;">[이미지: ${image.id}]</p></div>`;
    
    editor.chain().focus().insertContent(imageTag).run();
  };
  
  const handleImageDrop = (e) => {
    e.preventDefault();
    if (draggedImage && editor) {
      insertImageIntoEditor(draggedImage);
      setDraggedImage(null);
    }
  };
  
  const handleImageDragStart = (image) => {
    setDraggedImage(image);
  };
  
  const handleImageDragOver = (e) => {
    e.preventDefault();
  };

  const onFormSubmit = async (data) => {
    if (isSubmitting) return;
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
        content: editor?.getHTML() || data.content,
        post_type: data.category,
        images: images,
        author: authorName,
      };
      
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
    <Container size="fluid" py="xl" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '150vh' }}>
      {/* Header */}
      <Stack gap="xl" mb="xl">
        <Title 
          order={1} 
          ta="center" 
          style={{ fontSize: 'clamp(40px, 5vw, 48px)', fontWeight: 700, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--mantine-spacing-sm)' }}
        >
          <IconPencilPlus size={40} style={{color: 'var(--primary-600)'}} />
          새 글 작성
        </Title>
        <Text 
          ta="center" 
          size="lg" 
          style={{ maxWidth: 600, margin: '0 auto', color: 'var(--muted)', fontSize: '18px', lineHeight: '1.6' }}
        >
          식물에 관한 이야기를 자유롭게 나누어보세요. 리치 텍스트 에디터로 이미지를 드래그하여 삽입할 수 있습니다.
        </Text>
      </Stack>

      {/* Write Form */}
      <Card 
        shadow="var(--shadow-md)" 
        radius="var(--radius-lg)" 
        p={0} 
        style={{ 
          border: '1px solid rgba(15, 23, 36, 0.08)',
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <form onSubmit={handleSubmit(onFormSubmit)} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
          {/* Form Header */}
          <Box p="xl" style={{ borderBottom: '1px solid rgba(15, 23, 36, 0.08)', backgroundColor: 'var(--surface)' }}>
            <Title order={3} m={0} style={{ color: 'var(--charcoal)', fontWeight: 600 }}>
              게시글 정보
            </Title>
          </Box>

          {/* Form Body */}
          <Box p="xl" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--mantine-spacing-xl)', overflowY: 'auto' }}>
            
            {/* Category & Title */}
            <Group grow>
              <Select
                label="카테고리"
                placeholder="카테고리를 선택하세요"
                data={categories}
                {...register('category', { required: '카테고리를 선택해주세요' })}
                error={errors.category?.message}
                size="md"
                radius="lg"
              />
              <TextInput
                label="제목"
                placeholder="제목을 입력하세요"
                {...register('title', {
                  required: '제목을 입력해주세요',
                  minLength: { value: 2, message: '제목은 최소 2글자 이상이어야 합니다' },
                  maxLength: { value: 100, message: '제목은 100글자를 초과할 수 없습니다' }
                })}
                error={errors.title?.message}
                size="md"
                radius="lg"
              />
            </Group>

            {/* Image Upload */}
            <div>
              <Text size="sm" fw={500} mb="xs">이미지 첨부 (선택사항)</Text>
              <FileInput
                placeholder="클릭하거나 드래그하여 이미지 업로드"
                leftSection={<IconPhoto size={16} />}
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={images.length >= 10}
                size="md"
                radius="lg"
              />
              <Text size="xs" c="dimmed" mt="xs">JPG, PNG 파일만 가능, 최대 10개</Text>
              {images.length > 0 && (
                <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="sm" mt="md">
                  {images.map(image => (
                    <Box key={image.id} pos="relative">
                      <Image 
                        src={image.preview} 
                        alt="미리보기" 
                        radius="md" 
                        h={80} 
                        fit="cover" 
                        style={{ cursor: 'grab' }} 
                        draggable
                        onDragStart={() => handleImageDragStart(image)}
                        onClick={() => insertImageIntoEditor(image)} 
                        title="클릭하거나 드래그하여 에디터에 삽입" 
                      />
                      <ActionIcon size="sm" color="red" variant="filled" pos="absolute" top={4} right={4} onClick={() => removeImage(image.id)}>
                        <IconX size={12} />
                      </ActionIcon>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </div>

            {/* Rich Text Editor */}
            <Box style={{ 
                flex: 1,
                display: 'flex', 
                flexDirection: 'column' 
              }}>
              <Text size="sm" fw={500} mb="xs">내용</Text>
              <Controller
                name="content"
                control={control}
                rules={{ required: '내용을 입력해주세요' }}
                render={({ field }) => (
                  <RichTextEditor 
                    editor={editor}
                    style={{ minHeight: '60vh' }}
                    onDrop={handleImageDrop}
                    onDragOver={handleImageDragOver}
                    {...field}
                    onChange={(value) => {
                      field.onChange(value);
                      setValue('content', value);
                    }}
                  >
                    <RichTextEditor.Toolbar sticky stickyOffset={60}>
                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Bold />
                        <RichTextEditor.Italic />
                        <RichTextEditor.Underline />
                        <RichTextEditor.Strikethrough />
                        <RichTextEditor.ClearFormatting />
                        <RichTextEditor.Code />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.H1 />
                        <RichTextEditor.H2 />
                        <RichTextEditor.H3 />
                        <RichTextEditor.H4 />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Blockquote />
                        <RichTextEditor.Hr />
                        <RichTextEditor.BulletList />
                        <RichTextEditor.OrderedList />
                      </RichTextEditor.ControlsGroup>

                      <RichTextEditor.ControlsGroup>
                        <RichTextEditor.Link />
                        <RichTextEditor.Unlink />
                      </RichTextEditor.ControlsGroup>
                    </RichTextEditor.Toolbar>

                    <RichTextEditor.Content style={{ minHeight: '50vh' }} />
                  </RichTextEditor>
                )}
              />
              {errors.content && (
                <Text size="xs" c="red" mt="xs">{errors.content.message}</Text>
              )}
              <Text size="xs" c="dimmed" mt="xs">
                💡 이미지 업로드 팁: 위의 이미지를 클릭하거나 에디터로 드래그하여 삽입할 수 있습니다.
              </Text>
            </Box>
          </Box>

          {/* Form Footer */}
          <Box p="xl" style={{ borderTop: '1px solid rgba(15, 23, 36, 0.08)', backgroundColor: 'var(--surface)' }}>
            <Group justify="flex-end" gap="md">
              <Button variant="light" onClick={handleClose} size="md" radius="lg">취소</Button>
              <Button type="submit" leftSection={<IconSend size={16} />} disabled={isSubmitting} loading={isSubmitting} variant="gradient" gradient={{ from: 'green.5', to: 'green.6' }} size="md" radius="lg">
                {isSubmitting ? '게시하는 중...' : '게시하기'}
              </Button>
            </Group>
          </Box>
        </form>
      </Card>
    </Container>
  );
}

export default CommunityWrite;