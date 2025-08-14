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
          style: 'max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'
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
      shadow="sm"
      radius="lg"
      p={0}
      style={{
        border: '1px solid #e5e7eb',
        backgroundColor: 'white',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
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
            flex: 1,
            minHeight: 0
          },
          toolbar: {
            backgroundColor: '#fafbfc',
            borderBottom: '1px solid #e5e7eb',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 0,
            flexShrink: 0,
          },
          content: {
            backgroundColor: 'white',
            flex: 1,
            padding: 'var(--space-md)',
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: 'Pretendard, system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            '& .ProseMirror': {
              outline: 'none',
              flex: 1,
              minHeight: '100%',
              overflowY: 'auto',
              '& p': {
                marginBottom: '0.75rem',
              },
              '& h1': {
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '1rem',
                marginTop: '1.5rem',
                color: '#0f1724',
              },
              '& h2': {
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.875rem',
                marginTop: '1.25rem',
                color: '#0f1724',
              },
              '& h3': {
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                marginTop: '1rem',
                color: '#0f1724',
              },
              '& ul, & ol': {
                paddingLeft: '1.5rem',
                marginBottom: '1rem',
              },
              '& li': {
                marginBottom: '0.25rem',
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                margin: '0.75rem 0',
              },
              '& blockquote': {
                borderLeft: '0.25rem solid #16a34a',
                paddingLeft: '1rem',
                marginLeft: '0',
                fontStyle: 'italic',
                color: '#6b7280',
              }
            }
          },
          control: {
            border: 'none',
            backgroundColor: 'transparent',
            color: '#6b7280',
            '&:hover': {
              backgroundColor: '#f3f4f6',
              color: '#0f1724',
            },
            '&[data-active]': {
              backgroundColor: '#16a34a',
              color: 'white',
              '&:hover': {
                backgroundColor: '#15803d',
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

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

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