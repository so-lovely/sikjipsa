import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { PrimaryButton, Input } from '../styles/GlobalStyles';
import { useAuth } from '../context/AuthContext.jsx';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing[4]};
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius.xl};
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.xl};
`;

const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing[6]} ${props => props.theme.spacing[6]} ${props => props.theme.spacing[4]};
  border-bottom: 1px solid ${props => props.theme.colors.gray[200]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.gray[800]};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.gray[500]};
  cursor: pointer;
  padding: ${props => props.theme.spacing[1]};
  border-radius: ${props => props.theme.borderRadius.md};
  
  &:hover {
    background: ${props => props.theme.colors.gray[100]};
    color: ${props => props.theme.colors.gray[700]};
  }
`;

const ModalBody = styled.div`
  padding: ${props => props.theme.spacing[6]};
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing[6]};
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.gray[700]};
  margin-bottom: ${props => props.theme.spacing[2]};
`;

const CategorySelect = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1rem;
  background: white;
  color: ${props => props.theme.colors.gray[700]};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
  }
`;

const TitleInput = styled(Input)`
  width: 100%;
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[4]};
  font-size: 1rem;
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: ${props => props.theme.spacing[4]};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[100]};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.gray[400]};
  }
`;

const ImageUploadSection = styled.div`
  border: 2px dashed ${props => props.theme.colors.gray[300]};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing[6]};
  text-align: center;
  transition: all ${props => props.theme.transitions.fast};
  cursor: pointer;
  
  &:hover, &.dragover {
    border-color: ${props => props.theme.colors.primary[400]};
    background: ${props => props.theme.colors.primary[50]};
  }
  
  &.has-image {
    border-style: solid;
    border-color: ${props => props.theme.colors.primary[300]};
    background: ${props => props.theme.colors.primary[50]};
  }
`;

const ImageUploadText = styled.div`
  color: ${props => props.theme.colors.gray[600]};
  
  .icon {
    font-size: 2rem;
    margin-bottom: ${props => props.theme.spacing[2]};
  }
  
  .main-text {
    font-size: 1rem;
    margin-bottom: ${props => props.theme.spacing[1]};
  }
  
  .sub-text {
    font-size: 0.875rem;
    color: ${props => props.theme.colors.gray[500]};
  }
`;

const ImagePreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing[3]};
  margin-top: ${props => props.theme.spacing[4]};
`;

const PreviewImage = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing[1]};
  right: ${props => props.theme.spacing[1]};
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.red[600]};
  font-size: 0.875rem;
  margin-top: ${props => props.theme.spacing[1]};
`;

const ModalFooter = styled.div`
  padding: ${props => props.theme.spacing[4]} ${props => props.theme.spacing[6]} ${props => props.theme.spacing[6]};
  border-top: 1px solid ${props => props.theme.colors.gray[200]};
  display: flex;
  gap: ${props => props.theme.spacing[3]};
  justify-content: flex-end;
`;

const SecondaryButton = styled.button`
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[6]};
  border: 1px solid ${props => props.theme.colors.gray[300]};
  border-radius: ${props => props.theme.borderRadius.lg};
  background: white;
  color: ${props => props.theme.colors.gray[700]};
  font-weight: 500;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.gray[50]};
    border-color: ${props => props.theme.colors.gray[400]};
  }
`;

const SubmitButton = styled(PrimaryButton)`
  padding: ${props => props.theme.spacing[3]} ${props => props.theme.spacing[6]};
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const categories = [
  { value: '질문답변', label: '질문답변' },
  { value: '자랑하기', label: '자랑하기' },
  { value: '정보공유', label: '정보공유' },
  { value: '팁공유', label: '팁공유' },
  { value: '추천요청', label: '추천요청' },
];

function WritePostModal({ isOpen, onClose, onSubmit }) {
  const { user, isLoggedIn } = useAuth();
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();

  const handleClose = () => {
    reset();
    setImages([]);
    onClose();
  };

  const handleFileSelect = (files) => {
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // 최대 5개
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (imageId) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // URL 정리
      const removed = prev.find(img => img.id === imageId);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const onFormSubmit = async (data) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const authorName = user?.username || user?.name;
      
      if (!authorName) {
        alert('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      const formData = {
            ...data,
            post_type: data.category,  // category를 post_type으로 매핑
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
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>✏️ 새 글 작성</ModalTitle>
          <CloseButton onClick={handleClose}>✕</CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <ModalBody>
            <FormGroup>
              <Label htmlFor="category">카테고리</Label>
              <CategorySelect
                id="category"
                {...register('category', { required: '카테고리를 선택해주세요' })}
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </CategorySelect>
              {errors.category && (
                <ErrorMessage>{errors.category.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="title">제목</Label>
              <TitleInput
                id="title"
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
              />
              {errors.title && (
                <ErrorMessage>{errors.title.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="content">내용</Label>
              <ContentTextarea
                id="content"
                placeholder="식물에 관한 이야기를 자유롭게 나누어보세요..."
                {...register('content', {
                  required: '내용을 입력해주세요',
                  minLength: {
                    value: 10,
                    message: '내용은 최소 10글자 이상이어야 합니다'
                  }
                })}
              />
              {errors.content && (
                <ErrorMessage>{errors.content.message}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>이미지 첨부 (선택사항)</Label>
              <ImageUploadSection
                className={`${dragOver ? 'dragover' : ''} ${images.length > 0 ? 'has-image' : ''}`}
                onClick={() => document.getElementById('file-input').click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <ImageUploadText>
                  <div className="icon">📷</div>
                  <div className="main-text">
                    {images.length > 0 
                      ? `${images.length}개 이미지 선택됨`
                      : '클릭하거나 드래그하여 이미지 업로드'
                    }
                  </div>
                  <div className="sub-text">
                    JPG, PNG 파일만 가능, 최대 5개
                  </div>
                </ImageUploadText>
              </ImageUploadSection>
              
              <HiddenFileInput
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
              />

              {images.length > 0 && (
                <ImagePreview>
                  {images.map(image => (
                    <PreviewImage key={image.id}>
                      <img src={image.preview} alt="미리보기" />
                      <RemoveImageButton 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                      >
                        ✕
                      </RemoveImageButton>
                    </PreviewImage>
                  ))}
                </ImagePreview>
              )}
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <SecondaryButton type="button" onClick={handleClose}>
              취소
            </SecondaryButton>
            <SubmitButton 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? '작성 중...' : '글 작성하기'}
            </SubmitButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default WritePostModal;