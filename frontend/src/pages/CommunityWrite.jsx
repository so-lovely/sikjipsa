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
  Box,
} from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { IconPencilPlus, IconSend } from '@tabler/icons-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Underline,
      Highlight.configure({ multicolor: true })
    ],
    content: '',
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      category: '',
      title: '',
      content: ''
    }
  });

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleClose = () => {
    navigate('/community');
  };

  // 이미지 업로드 핸들러 (onImageUpload용)
  const handleImageUpload = async (file) => {
    try {
      const imageUrl = await communityAPI.uploadImage(file);
      return imageUrl;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
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
        author: authorName,
      };
      
      await communityAPI.createPost(formData);
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
              <div>
                <Text size="sm" fw={500} mb="xs">카테고리</Text>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: '카테고리를 선택해주세요' }}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      placeholder="카테고리를 선택하세요"
                      data={categories}
                      value={value}
                      onChange={onChange}
                      error={errors.category?.message}
                      size="md"
                      radius="lg"
                    />
                  )}
                />
              </div>
              <div>
                <Text size="sm" fw={500} mb="xs">제목</Text>
                <TextInput
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
              </div>
            </Group>


            {/* Rich Text Editor */}
            <Box style={{ 
                flex: 1,
                display: 'flex', 
                flexDirection: 'column' 
              }}>
              <Text size="sm" fw={500} mb="xs">내용</Text>
              <RichTextEditor 
                editor={editor}
                onImageUpload={handleImageUpload}
                styles={{
                  root: {
                    minHeight: 'clamp(40vh, 60vh, 70vh)',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    '@media (max-width: 768px)': {
                      minHeight: '40vh',
                      fontSize: '16px'
                    }
                  },
                  toolbar: {
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: 'clamp(8px, 2vw, 12px)',
                    '@media (max-width: 768px)': {
                      padding: '8px',
                      gap: '2px'
                    }
                  },
                  controlsGroup: {
                    '@media (max-width: 768px)': {
                      gap: '2px'
                    }
                  }
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

                <RichTextEditor.Content 
                  styles={{
                    content: {
                      minHeight: 'clamp(35vh, 50vh, 60vh)',
                      backgroundColor: '#ffffff',
                      padding: 'clamp(8px, 2vw, 16px)',
                      fontSize: 'clamp(14px, 2.5vw, 16px)',
                      lineHeight: '1.6',
                      '@media (max-width: 768px)': {
                        minHeight: '35vh',
                        padding: '12px',
                        fontSize: '16px'
                      },
                      '@media (max-width: 480px)': {
                        minHeight: '30vh',
                        padding: '8px',
                        fontSize: '16px'
                      }
                    }
                  }}
                />
              </RichTextEditor>
              <Text size="xs" c="dimmed" mt="xs">
                💡 이미지 업로드 팁: 이미지를 에디터로 드래그하거나 붙여넣기하면 자동으로 업로드됩니다.
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