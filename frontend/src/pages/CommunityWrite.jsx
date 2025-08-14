import React, { useState } from 'react';
import { Container, Box, Group, ActionIcon, Text } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import TiptapEditor from '../components/TiptapEditor';

const PostEditor = () => {
  const [content, setContent] = useState('');

  return (
    <Container 
      size="lg" 
      style={{ 
        height: 'calc(100vh - 80px)', // Account for header height
        display: 'flex', 
        flexDirection: 'column',
        paddingTop: 'var(--space-lg)',
        paddingBottom: 'var(--space-md)',
        paddingLeft: 'var(--space-md)',
        paddingRight: 'var(--space-md)'
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
              background: 'var(--primary-gradient)',
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

      {/* Editor container with flex: 1 */}
      <Box 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0 // Important for flex child overflow
        }}
      >
        <TiptapEditor 
          content={content} 
          onChange={setContent} 
        />
      </Box>
    </Container>
  );
};

export default PostEditor;