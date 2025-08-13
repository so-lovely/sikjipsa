import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Modal,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Select,
  FileInput,
  Image,
  ActionIcon,
  Box,
  SimpleGrid,
  Text as MantineText
} from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { IconPhoto, IconX, IconSend, IconPencilPlus } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';

const categories = [
  { value: 'general', label: '일반' },
  { value: 'question', label: '질문' },
  { value: 'tip', label: '꿀팁' },
  { value: 'share', label: '자랑' },
  { value: 'trade', label: '나눔' },
];

function WritePostModal({ isOpen, onClose, onSubmit }) {
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
    reset,
    control,
  } = useForm();

  const handleClose = () => {
    reset();
    setImages([]);
    editor?.commands.clearContent();
    onClose();
  };

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2, 11)
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // 최대 5개
  };

  const removeImage = (imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      const removed = prev.find(img => img.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
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
      
      const editorContent = editor?.getHTML() || '';
      if (!editorContent || editorContent === '<p></p>') {
        alert('내용을 입력해주세요.');
        setIsSubmitting(false);
        return;
      }
      
      const formData = {
        ...data,
        content: editorContent,
        post_type: data.category,
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
      title={<Title order={3} c="gray.8"><IconPencilPlus size={20} style={{marginRight: '8px'}} />새 글 작성</Title>}
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

          {/* Rich Text Editor */}
          <div>
            <MantineText size="sm" fw={500} mb="xs" c="gray.7">내용</MantineText>
            {editor ? (
              <Controller
                name="content"
                control={control}
                rules={{ 
                  required: '내용을 입력해주세요',
                  minLength: {
                    value: 10,
                    message: '내용은 최소 10글자 이상이어야 합니다'
                  }
                }}
                render={() => (
                  <RichTextEditor 
                    editor={editor}
                    style={{ minHeight: '300px' }}
                    onDrop={handleImageDrop}
                    onDragOver={handleImageDragOver}
                  >
                    <RichTextEditor.Toolbar>
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

                    <RichTextEditor.Content 
                      style={{ minHeight: '250px' }}
                      onDrop={handleImageDrop}
                      onDragOver={handleImageDragOver}
                    />
                  </RichTextEditor>
                )}
              />
            ) : (
              <Box style={{ minHeight: '300px', border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
                <MantineText c="dimmed">에디터를 로딩 중...</MantineText>
              </Box>
            )}
            {errors.content && (
              <Text size="xs" c="red" mt="xs">{errors.content.message}</Text>
            )}
            <MantineText size="xs" c="dimmed" mt="xs">
              💡 이미지 업로드 팁: 위의 이미지를 클릭하거나 에디터로 드래그하여 삽입할 수 있습니다.
            </MantineText>
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
                      style={{ cursor: 'grab' }}
                      draggable
                      onDragStart={() => handleImageDragStart(image)}
                      onClick={() => insertImageIntoEditor(image)}
                      title="클릭하거나 드래그하여 에디터에 삽입"
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