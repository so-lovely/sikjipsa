import React, { useState, useEffect } from 'react';
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
  Text as MantineText
} from '@mantine/core';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Dropcursor from '@tiptap/extension-dropcursor';
import { IconSend, IconPencilPlus } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { communityAPI } from '../api/community.js';

const categories = [
  { value: 'general', label: '일반' },
  { value: 'question', label: '질문' },
  { value: 'tip', label: '꿀팁' },
  { value: 'share', label: '자랑' },
  { value: 'trade', label: '나눔' },
];

function WritePostModal({ isOpen, onClose, onSubmit }) {
  const { user, isLoggedIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에서 기본 Link를 제외하고 우리가 직접 설정한 Link 사용
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Dropcursor.configure({
        color: 'var(--mantine-primary-color)',
        width: 2,
      }),
    ],
    content: '',
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    defaultValues: {
      category: '',
      title: '',
      content: ''
    }
  });

  const handleClose = () => {
    reset();
    editor?.commands.clearContent();
    onClose();
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

  // 브라우저 기본 드래그&드롭 동작 방지 (모달이 열려있을 때만)
  useEffect(() => {
    if (!isOpen) return;

    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 전체 문서에서 기본 드래그&드롭 동작 방지
    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    events.forEach(eventName => {
      document.addEventListener(eventName, preventDefault, false);
    });

    // 컴포넌트 언마운트 또는 모달 닫힐 때 이벤트 리스너 제거
    return () => {
      events.forEach(eventName => {
        document.removeEventListener(eventName, preventDefault, false);
      });
    };
  }, [isOpen]);


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
      const textContent = editor?.getText() || '';
      if (!textContent.trim() || editorContent === '<p></p>') {
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
            <RichTextEditor 
              editor={editor}
              onImageUpload={handleImageUpload}
              styles={{
                root: {
                  minHeight: 'clamp(250px, 30vh, 400px)',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  '@media (max-width: 768px)': {
                    minHeight: '250px',
                    fontSize: '16px'
                  }
                },
                toolbar: {
                  flexWrap: 'wrap',
                  gap: '4px',
                  padding: 'clamp(6px, 1.5vw, 10px)',
                  '@media (max-width: 768px)': {
                    padding: '6px',
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
                styles={{
                  content: {
                    minHeight: 'clamp(200px, 25vh, 300px)',
                    backgroundColor: '#ffffff',
                    padding: 'clamp(8px, 1.5vw, 12px)',
                    fontSize: 'clamp(14px, 2.5vw, 16px)',
                    lineHeight: '1.6',
                    '@media (max-width: 768px)': {
                      minHeight: '200px',
                      padding: '8px',
                      fontSize: '16px'
                    },
                    '@media (max-width: 480px)': {
                      minHeight: '180px',
                      padding: '8px',
                      fontSize: '16px'
                    }
                  }
                }}
              />
            </RichTextEditor>
            <MantineText size="xs" c="dimmed" mt="xs">
              💡 이미지 업로드 팁: 이미지를 에디터로 드래그하거나 붙여넣기하면 자동으로 업로드됩니다.
            </MantineText>
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