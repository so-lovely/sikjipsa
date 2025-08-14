import React, { useCallback, useRef } from 'react';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { ActionIcon, Box, Group, Paper } from '@mantine/core';
import { IconPhoto } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import apiClient from '../api/client';

const TiptapEditor = ({ content, onChange }) => {
  const fileInputRef = useRef(null);

  // Image upload handler
  const handleImageUpload = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiClient.post('/community/upload-image', formData);
      return response.data.url;
    } catch (error) {
      console.error('Image upload failed:', error);
      notifications.show({
        title: 'Upload Failed',
        message: 'Failed to upload image. Please try again.',
        color: 'red',
      });
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: var(--mantine-radius-md); box-shadow: 0 0.125rem 0.5rem rgba(0,0,0,0.1);'
        },
      }),
    ],
    content: content || '',
    onUpdate({ editor }) {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Insert image function
  const insertImage = useCallback(async (file) => {
    if (!editor || !file.type.startsWith('image/')) return;

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  }, [editor, handleImageUpload]);

  // File select handler
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      insertImage(file);
    }
    event.target.value = '';
  }, [insertImage]);

  // Drag and drop handlers
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      insertImage(imageFile);
    }
  }, [insertImage]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <Paper
      shadow="md"
      radius="lg"
      p={0}
      style={{
        border: 'none',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        height: '100%',
        flexDirection: 'column',
        minHeight: 0,
        boxShadow: 'none',
      }}
    >
      <RichTextEditor
        editor={editor}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        styles={{
          root: {
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          },
          toolbar: {
            backgroundColor: '#f8fafc',
            borderBottom: '0.125rem solid #e5e7eb',
            padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
            borderRadius: 0,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          },
          content: {
            backgroundColor: 'white',
            flex: 1,
            padding: 'var(--mantine-spacing-lg) var(--mantine-spacing-xl)',
            fontSize: 'var(--mantine-font-size-md)',
            lineHeight: '1.8',
            fontFamily: 'Pretendard, system-ui, sans-serif',
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            minHeight: '12.5rem',
            maxHeight: 'calc(100vh - 12.5rem)',
            '&::-webkit-scrollbar': {
              width: '0.5rem',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f3f5',
              borderRadius: '0.25rem',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#dee2e6',
              borderRadius: '0.25rem',
              '&:hover': {
                backgroundColor: '#ced4da',
              },
            },
            '& .ProseMirror': {
              outline: 'none',
              minHeight: '12.5rem',
              maxWidth: '100%',
              position: 'relative',
              zIndex: 1,
              '& p': {
                marginBottom: 'var(--mantine-spacing-md)',
              },
              '& h1': {
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 700,
                marginBottom: 'var(--mantine-spacing-lg)',
                marginTop: 'var(--mantine-spacing-xl)',
                color: '#0f1724',
              },
              '& h2': {
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                fontWeight: 600,
                marginBottom: 'var(--mantine-spacing-md)',
                marginTop: 'var(--mantine-spacing-lg)',
                color: '#0f1724',
              },
              '& h3': {
                fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                fontWeight: 600,
                marginBottom: 'var(--mantine-spacing-sm)',
                marginTop: 'var(--mantine-spacing-md)',
                color: '#0f1724',
              },
              '& ul, & ol': {
                paddingLeft: 'var(--mantine-spacing-xl)',
                marginBottom: 'var(--mantine-spacing-md)',
              },
              '& li': {
                marginBottom: 'var(--mantine-spacing-xs)',
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'var(--mantine-radius-md)',
                boxShadow: '0 0.125rem 0.5rem rgba(0,0,0,0.1)',
                margin: 'var(--mantine-spacing-md) 0',
              },
              '& blockquote': {
                borderLeft: '0.25rem solid #16a34a',
                paddingLeft: 'var(--mantine-spacing-md)',
                marginLeft: '0',
                fontStyle: 'italic',
                color: '#6b7280',
              },
              '@media (max-width: 48em)': {
                '& h1': {
                  fontSize: '1.5rem',
                },
                '& h2': {
                  fontSize: '1.25rem',
                },
                '& h3': {
                  fontSize: '1.125rem',
                },
              }
            }
          },
          control: {
            border: '0.0625rem solid transparent',
            backgroundColor: 'transparent',
            color: '#6b7280',
            borderRadius: 'var(--mantine-radius-sm)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#f3f4f6',
              color: '#0f1724',
              transform: 'translateY(-0.0625rem)',
            },
            '&[data-active]': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 0.125rem 0.5rem rgba(102, 126, 234, 0.3)',
              '&:hover': {
                transform: 'translateY(-0.0625rem)',
                boxShadow: '0 0.25rem 0.75rem rgba(102, 126, 234, 0.4)',
              }
            }
          }
        }}
      >
        <RichTextEditor.Toolbar>
          <Group gap="xs">
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
            </RichTextEditor.ControlsGroup>

            <Box style={{ width: '0.0625rem', height: '1.5rem', backgroundColor: '#e5e7eb' }} />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
            </RichTextEditor.ControlsGroup>

            <Box style={{ width: '0.0625rem', height: '1.5rem', backgroundColor: '#e5e7eb' }} />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>

            <Box style={{ width: '0.0625rem', height: '1.5rem', backgroundColor: '#e5e7eb' }} />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <Box style={{ width: '0.0625rem', height: '1.5rem', backgroundColor: '#e5e7eb' }} />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <Box style={{ width: '0.0625rem', height: '1.5rem', backgroundColor: '#e5e7eb' }} />

            <RichTextEditor.ControlsGroup>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  color: '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                    color: '#0f1724',
                  }
                }}
                title="Insert Image"
              >
                <IconPhoto size="1rem" />
              </ActionIcon>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </RichTextEditor.ControlsGroup>

            <Box style={{ width: '0.0625rem', height: '1.5rem', backgroundColor: '#e5e7eb' }} />

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </Group>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>
    </Paper>
  );
};

export default TiptapEditor;