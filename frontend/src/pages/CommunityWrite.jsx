import React, { useState } from 'react';
import TiptapEditor from '../components/TiptapEditor';

const PostEditor = () => {
  const [content, setContent] = useState('');

  return (
    <div>
      <h1>글쓰기</h1>
      <TiptapEditor 
        content={content} 
        onChange={setContent} 
      />
    </div>
  );
};

export default PostEditor;