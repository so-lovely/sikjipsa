import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import './TiptapEditor.css'; // 스타일 파일
import apiClient from  '../api/client'

const TiptapEditor = ({ content, onChange }) => {
  const fileInputRef = useRef(null);

  // 이미지 업로드 처리 함수
  const handleImageUpload = useCallback(async (file) => {
    console.log(file, '을 받았습니다');
    try {
      // 실제 구현 시 서버로 업로드하고 URL을 받아와야 합니다
      const formData = new FormData();
      formData.append('image', file);
      console.log(formData, '폼데이터');
      const response = await apiClient.post('/community/upload-image', formData);
      console.log('handleImageUpload에서 받은 response', response)
      return response.data.url;
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'custom-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'custom-link',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // 이미지 삽입 함수
  const insertImage = useCallback(async (file) => {
    console.log(file, 'insertImage함수에서 받은')
    if (!editor) return;

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  }, [editor, handleImageUpload]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    console.log(file,'handleFileSelect에서 파일받은')
    if (file && file.type.startsWith('image/')) {
      insertImage(file);
    }
    // 파일 input 초기화
    event.target.value = '';
  }, [insertImage]);

  // 드래그 앤 드롭 핸들러
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
    return <div>에디터 로딩 중...</div>;
  }

  return (
    <div className="tiptap-editor-container">
      {/* 툴바 */}
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'active' : ''}
            title="굵게"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'active' : ''}
            title="기울임"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'active' : ''}
            title="밑줄"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'active' : ''}
            title="취소선"
          >
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}
            title="제목 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
            title="제목 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
            title="제목 3"
          >
            H3
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'active' : ''}
            title="불릿 리스트"
          >
            • 목록
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'active' : ''}
            title="번호 리스트"
          >
            1. 목록
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
            title="왼쪽 정렬"
          >
            ←
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
            title="가운데 정렬"
          >
            ↔
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
            title="오른쪽 정렬"
          >
            →
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="이미지 업로드"
          >
            📷 이미지
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="되돌리기"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시 실행"
          >
            ↷
          </button>
        </div>
      </div>

      {/* 에디터 영역 */}
      <div
        className="editor-content"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;