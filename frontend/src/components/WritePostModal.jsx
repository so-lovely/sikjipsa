import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Modal,
  Title,
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
      console.log('이미지 업로드 시작:', file.name);
      const imageUrl = await communityAPI.uploadImage(file);
      console.log('이미지 업로드 완료:', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  useEffect(() => {
    const editorElement = document.querySelector('.mantine-RichTextEditor-root');
    if (!editorElement) return;

    const handleDragOver = (e) => {
      // 파일이 드래그될 때만 기본 동작을 막습니다.
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    };

    // document 대신 에디터 요소에 직접 이벤트 리스너를 추가하여
    // 다른 영역에 영향을 주지 않도록 범위를 좁힙니다.
    editorElement.addEventListener('dragover', handleDragOver);

    // drop 이벤트 리스너는 제거합니다. Tiptap이 알아서 처리합니다.

    return () => {
      editorElement.removeEventListener('dragover', handleDragOver);
    };
  }, [editor]); // editor가 초기화되면 실행




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
                  minHeight: 'clamp(15.625rem, 30vh, 25rem)',
                  backgroundColor: '#ffffff',
                  border: '0.125rem solid #d1d5db',
                  borderRadius: '0.5rem',
                  '@media (max-width: 48rem)': {
                    minHeight: '15.625rem',
                    fontSize: '1rem'
                  }
                },
                toolbar: {
                  flexWrap: 'wrap',
                  gap: '4px',
                  padding: 'clamp(0.375rem, 1.5vw, 0.625rem)',
                  '@media (max-width: 48rem)': {
                    padding: '0.375rem',
                    gap: '0.125rem'
                  }
                },
                controlsGroup: {
                  '@media (max-width: 48rem)': {
                    gap: '0.125rem'
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
                    minHeight: 'clamp(12.5rem, 25vh, 18.75rem)',
                    backgroundColor: '#ffffff',
                    padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    lineHeight: '1.6',
                    '@media (max-width: 48rem)': {
                      minHeight: '12.5rem',
                      padding: '0.5rem',
                      fontSize: '1rem'
                    },
                    '@media (max-width: 30rem)': {
                      minHeight: '11.25rem',
                      padding: '0.5rem',
                      fontSize: '1rem'
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