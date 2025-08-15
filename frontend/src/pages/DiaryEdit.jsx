import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Group,
  Card,
  Stack,
  Select,
  Alert,
  Box,
  SimpleGrid,
  Image,
  ActionIcon,
  Center,
  Loader,
  rem
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconAlertCircle, IconCalendar, IconArrowLeft, IconSeedling,IconPencil, IconLeaf, IconFlower, IconTree, IconMoon, IconEdit } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { diaryAPI } from '../api/diary';

function DiaryEdit() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { diaryId, entryId } = useParams();
  
  const [diary, setDiary] = useState(null);
  const [originalEntry, setOriginalEntry] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    growthStage: 'growing',
    entryDate: new Date().toISOString().split('T')[0]
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const loadEntryData = async () => {
      try {
        setError('');
        const diaryData = await diaryAPI.getDiary(diaryId);
        setDiary(diaryData);
        
        const entry = diaryData.entries?.find(e => e.id === parseInt(entryId));
        if (!entry) {
          throw new Error('해당 일기를 찾을 수 없습니다.');
        }
        
        setOriginalEntry(entry);
        setFormData({
          title: entry.title || '',
          content: entry.content || '',
          growthStage: entry.growth_stage || 'growing',
          entryDate: new Date(entry.entry_date).toISOString().split('T')[0]
        });

        // Parse existing images
        let images = [];
        if (entry.images) {
          try {
            if (Array.isArray(entry.images)) {
              images = entry.images;
            } else if (typeof entry.images === 'string') {
              images = JSON.parse(entry.images);
            }
          } catch (e) {
            console.warn('Failed to parse entry images:', entry.images);
          }
        }
        setExistingImages(Array.isArray(images) ? images : []);
        
      } catch (error) {
        console.error('Error loading entry:', error);
        setError('일기를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (diaryId && entryId) {
      loadEntryData();
    }
  }, [isLoggedIn, navigate, diaryId, entryId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileSelect = async (files) => {
    const validFiles = [];
    
    for (const file of files) {
      try {
        diaryAPI.validateImageFile(file);
        const preview = await diaryAPI.fileToBase64(file);
        validFiles.push({ file, preview });
      } catch (error) {
        setError(error.message);
        return;
      }
    }
    
    setNewImages(prev => [...prev, ...validFiles]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      const entryData = {
        title: formData.title,
        content: formData.content,
        growth_stage: formData.growthStage,
        entry_date: formData.entryDate
      };
      
      const imageFiles = newImages.map(img => img.file);
      
      await diaryAPI.updateEntry(diaryId, entryId, entryData, imageFiles, existingImages);
      
      // Success - navigate back to detail view
      navigate(`/diary/${diaryId}/${entryId}`);
    } catch (error) {
      console.error('Error updating entry:', error);
      setError('일기 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/diary/${diaryId}/${entryId}`);
  };

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader color="green" size="lg" />
            <Text size="lg" fw={600} c="gray.7">
              일기를 불러오고 있습니다...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Box mb="xl">
        <Group justify="center" gap="sm">
            <ActionIcon
                        variant="filled"
                        size="xl"
                        radius="xl"
                        style={{
                          background: 'linear-gradient(135deg, #A9E5C4 0%, #79D1A0 100%)',
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
                        Edit Diary
                      </Text>
         </Group>
       </Box>

      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={handleBack}
        mb="xl"
        color="gray"
      >
        뒤로 가기
      </Button>

      <Card shadow="md" radius="lg" p="xl">
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="오류 발생"
            color="red"
            mb="xl"
            variant="light"
          >
            {error}
          </Alert>
        )}
        
        {isSaving ? (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader color="green" size="lg" />
              <Text size="lg" fw={600} c="gray.7">
                일기를 저장하고 있습니다...
              </Text>
            </Stack>
          </Center>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap="xl">
              {/* Basic Info */}
              <Group grow>
                <TextInput
                  label="기록 날짜"
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => handleInputChange('entryDate', e.target.value)}
                  required
                  leftSection={<IconCalendar size={16} />}
                />
                <Select
                  label="성장 단계"
                  data={[
                    { value: 'seedling', label: '새싹' },
                    { value: 'growing', label: '성장중' },
                    { value: 'flowering', label: '개화중' },
                    { value: 'mature', label: '성숙' },
                    { value: 'dormant', label: '휴면' }
                  ]}
                  value={formData.growthStage}
                  onChange={(value) => handleInputChange('growthStage', value)}
                  renderOption={({ option }) => {
                                      const icons = {
                                        seedling: <IconSeedling size={14} color="var(--mantine-color-green-6)" />,
                                        growing: <IconLeaf size={14} color="var(--mantine-color-green-6)" />,
                                        flowering: <IconFlower size={14} color="var(--mantine-color-pink-6)" />,
                                        mature: <IconTree size={14} color="var(--mantine-color-green-7)" />,
                                        dormant: <IconMoon size={14} color="var(--mantine-color-gray-6)" />
                                      };
                                      return (
                                        <Group gap="xs">
                                          {icons[option.value]}
                                          {option.label}
                                        </Group>
                                      );
                                    }}
                />
              </Group>

              <TextInput
                label="제목 (선택사항)"
                placeholder="예: 새잎이 나왔어요!"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />

              <Textarea
                label="내용"
                placeholder="오늘 식물의 상태나 변화, 관리 내용 등을 자유롭게 적어보세요..."
                minRows={6}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                required
              />

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">기존 사진</Text>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                    {existingImages.map((image, index) => (
                      <Box key={index} pos="relative">
                        <Image
                          src={image}
                          alt={`기존 사진 ${index + 1}`}
                          radius="md"
                          h={120}
                          style={{ objectFit: 'cover' }}
                        />
                        <ActionIcon
                          color="red"
                          size="sm"
                          radius="xl"
                          variant="filled"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4
                          }}
                          onClick={() => removeExistingImage(index)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {/* New Images Upload */}
              <Box>
                <Text size="sm" fw={500} mb="xs">새 사진 추가</Text>
                <Dropzone
                  onDrop={handleFileSelect}
                  onReject={() => {
                    setError('지원하지 않는 파일 형식이거나 파일이 너무 큽니다.');
                  }}
                  maxSize={5 * 1024 ** 2}
                  accept={IMAGE_MIME_TYPE}
                  multiple
                >
                  <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                    <Dropzone.Accept>
                      <IconUpload
                        style={{
                          width: rem(52),
                          height: rem(52),
                          color: 'var(--mantine-color-green-6)'
                        }}
                        stroke={1.5}
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX
                        style={{
                          width: rem(52),
                          height: rem(52),
                          color: 'var(--mantine-color-red-6)'
                        }}
                        stroke={1.5}
                      />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconPhoto
                        style={{
                          width: rem(52),
                          height: rem(52),
                          color: 'var(--mantine-color-dimmed)'
                        }}
                        stroke={1.5}
                      />
                    </Dropzone.Idle>

                    <div>
                      <Text size="xl" fw={600} c="gray.8" mb="sm">
                        새 사진을 업로드하세요
                      </Text>
                      <Text size="sm" c="dimmed" mb="md">
                        드래그 앤 드롭하거나 클릭하여 파일을 선택하세요
                      </Text>
                      <Text size="xs" c="dimmed">
                        JPG, PNG 파일 최대 10MB
                      </Text>
                    </div>
                  </Group>
                </Dropzone>

                {/* New Images Preview */}
                {newImages.length > 0 && (
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md" mt="md">
                    {newImages.map((image, index) => (
                      <Box key={index} pos="relative">
                        <Image
                          src={image.preview}
                          alt={`새 사진 ${index + 1}`}
                          radius="md"
                          h={120}
                          style={{ objectFit: 'cover' }}
                        />
                        <ActionIcon
                          color="red"
                          size="sm"
                          radius="xl"
                          variant="filled"
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4
                          }}
                          onClick={() => removeNewImage(index)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>

              {/* Action Buttons */}
              <Group justify="flex-end" gap="md">
                <Button
                  variant="light"
                  color="gray"
                  onClick={handleBack}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  gradient={{ from: 'green.5', to: 'green.6' }}
                  disabled={isSaving}
                  leftSection={isSaving ? <Loader size={16} /> : <IconEdit size={16} />}
                >
                  {isSaving ? '저장 중...' : '수정 완료'}
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Card>
    </Container>
  );
}

export default DiaryEdit;