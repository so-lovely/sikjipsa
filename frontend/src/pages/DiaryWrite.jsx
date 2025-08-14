import React, { useState, useRef, useEffect } from 'react';
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
import { IconUpload, IconPhoto, IconX, IconAlertCircle, IconCalendar, IconSeedling, IconLeaf, IconFlower, IconTree, IconMoon } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { diaryAPI } from '../api/diary';
import { plantAPI } from '../api/plants';

function DiaryWrite() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { diaryId } = useParams(); // 기존 다이어리에 엔트리 추가할 때
  
  const [diaries, setDiaries] = useState([]);
  const [plants, setPlants] = useState([]);
  const [showNewDiaryForm, setShowNewDiaryForm] = useState(false);
  const [formData, setFormData] = useState({
    diaryId: diaryId || '',
    title: '',
    content: '',
    growthStage: 'seedling',
    entryDate: new Date().toISOString().split('T')[0],
    category: ''
  });
  const [newDiaryData, setNewDiaryData] = useState({
    plantId: '',
    plantNickname: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 다이어리 목록과 식물 목록 로드
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        // 다이어리 목록 로드
        const diariesData = await diaryAPI.getUserDiaries();
        setDiaries(diariesData);
        
        // 식물 목록 로드 (새 다이어리 생성시 선택용)
        const plantsData = await plantAPI.getAllPlants();
        setPlants(Array.isArray(plantsData) ? plantsData : []);
        
        // diaryId가 URL에 있으면 해당 다이어리로 설정
        if (diaryId) {
          setFormData(prev => ({ ...prev, diaryId }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('데이터를 불러오는데 실패했습니다.');
      }
    };

    loadData();
  }, [isLoggedIn, navigate, diaryId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNewDiaryInputChange = (field, value) => {
    setNewDiaryData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleDiarySelectChange = (value) => {
    if (value === 'new') {
      setShowNewDiaryForm(true);
      setFormData(prev => ({ ...prev, diaryId: '' }));
    } else {
      setShowNewDiaryForm(false);
      setFormData(prev => ({ ...prev, diaryId: value }));
    }
    setError('');
  };

  const createNewDiary = async () => {
    if (!newDiaryData.plantId) {
      setError('식물을 선택해주세요.');
      return null;
    }
    
    if (!newDiaryData.plantNickname.trim()) {
      setError('식물 별명을 입력해주세요.');
      return null;
    }

    try {
      const diaryData = {
        plant_id: parseInt(newDiaryData.plantId),
        plant_nickname: newDiaryData.plantNickname,
        start_date: new Date(newDiaryData.startDate).toISOString()
      };
      
      const createdDiary = await diaryAPI.createDiary(diaryData);
      
      // 새로 생성된 다이어리를 목록에 추가
      setDiaries(prev => [createdDiary, ...prev]);
      
      return createdDiary.id;
    } catch (error) {
      console.error('Error creating diary:', error);
      setError('다이어리 생성에 실패했습니다.');
      return null;
    }
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
    
    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      let targetDiaryId = formData.diaryId;
      
      // 새 다이어리를 생성해야 하는 경우
      if (showNewDiaryForm) {
        const createdDiaryId = await createNewDiary();
        if (!createdDiaryId) {
          setIsLoading(false);
          return; // 다이어리 생성 실패시 종료
        }
        targetDiaryId = createdDiaryId;
      }
      
      if (!targetDiaryId) {
        setError('다이어리를 선택하거나 새로 생성해주세요.');
        setIsLoading(false);
        return;
      }
      
      const entryData = {
        title: formData.title,
        content: formData.content,
        growth_stage: formData.growthStage,
        entry_date: formData.entryDate // ISO 형식 변환은 API에서 처리
      };
      
      // 실제 파일 객체들을 전달
      const imageFiles = images.map(img => img.file);
      
      await diaryAPI.addEntry(targetDiaryId, entryData, imageFiles);
      
      // 성공 시 다이어리 페이지로 이동
      navigate('/diary');
    } catch (error) {
      console.error('Error creating entry:', error);
      setError('일기 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null; // useEffect에서 redirect 처리
  }

  return (
    <Container size="md" py={50}>
      {/* Hero Section */}
      <Stack align="center" gap="lg" mb={40}>
        <Title order={1} ta="center" c="green.7" fw={700}>
          성장 일기 쓰기
        </Title>
        <Text size="md" ta="center" c="gray.6" maw={500}>
          식물의 소중한 순간을 기록해보세요
        </Text>
      </Stack>

      <Card shadow="sm" radius="md" p={30}>
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
        
        {isLoading ? (
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
            <Stack spacing="xl">
              {/* 식물 다이어리 선택 */}
              <Box>
                <Select
                  label="식물 다이어리"
                  placeholder="다이어리를 선택하세요"
                  data={[
                    ...diaries.map(diary => ({
                      value: diary.id.toString(),
                      label: diary.plant_nickname || diary.plant?.name || '식물'
                    })),
                    { value: 'new', label: '➕ 새 다이어리 만들기' }
                  ]}
                  value={showNewDiaryForm ? 'new' : formData.diaryId}
                  onChange={(value) => handleDiarySelectChange(value)}
                  required
                  leftSection={
                    formData.growthStage === 'seedling' ? <IconSeedling size={16} color="var(--mantine-color-green-6)" /> :
                    formData.growthStage === 'growing' ? <IconLeaf size={16} color="var(--mantine-color-green-6)" /> :
                    formData.growthStage === 'flowering' ? <IconFlower size={16} color="var(--mantine-color-pink-6)" /> :
                    formData.growthStage === 'mature' ? <IconTree size={16} color="var(--mantine-color-green-7)" /> :
                    formData.growthStage === 'dormant' ? <IconMoon size={16} color="var(--mantine-color-gray-6)" /> :
                    <IconSeedling size={16} color="var(--mantine-color-green-6)" />
                  }
                />
              </Box>

              {/* 새 다이어리 폼 */}
              {showNewDiaryForm && (
                <Card
                  shadow="sm"
                  radius="md"
                  p="lg"
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #bbf7d0'
                  }}
                >
                  <Title order={3} c="green.6" mb="md">
                    새 다이어리 정보
                  </Title>
                  
                  <Stack gap="md">
                    <Select
                      label="식물 선택"
                      placeholder="식물을 선택하세요"
                      data={Array.isArray(plants) ? plants.map(plant => ({
                        value: plant.id.toString(),
                        label: `${plant.name} (${plant.scientific_name})`
                      })) : []}
                      value={newDiaryData.plantId}
                      onChange={(value) => handleNewDiaryInputChange('plantId', value)}
                      required
                      searchable
                    />
                    
                    <TextInput
                      label="식물 별명"
                      placeholder="예: 우리집 몬스테라"
                      value={newDiaryData.plantNickname}
                      onChange={(e) => handleNewDiaryInputChange('plantNickname', e.target.value)}
                      required
                    />
                    
                    <TextInput
                      label="키우기 시작한 날"
                      type="date"
                      value={newDiaryData.startDate}
                      onChange={(e) => handleNewDiaryInputChange('startDate', e.target.value)}
                      required
                      leftSection={<IconCalendar size={16} />}
                    />
                  </Stack>
                </Card>
              )}

              {/* 기록 정보 */}
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

              {/* 사진 업로드 */}
              <Box>
                <Text size="sm" fw={500} mb="xs">사진 추가</Text>
                <Dropzone
                  onDrop={handleFileSelect}
                  onReject={(files) => {
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
                        사진을 업로드하세요
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

                {/* 이미지 미리보기 */}
                {images.length > 0 && (
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md" mt="md">
                    {images.map((image, index) => (
                      <Box key={index} pos="relative">
                        <Image
                          src={image.preview}
                          alt={`미리보기 ${index + 1}`}
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
                          onClick={() => removeImage(index)}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>

              {/* 액션 버튼 */}
              <Group justify="flex-end" gap="md">
                <Button
                  variant="light"
                  color="gray"
                  onClick={() => navigate('/diary')}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  gradient={{ from: 'green.5', to: 'green.6' }}
                  disabled={isLoading}
                  leftSection={isLoading ? <Loader size={16} /> : '📝'}
                >
                  {isLoading ? '저장 중...' : '일기 저장'}
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Card>
    </Container>
  );
}

export default DiaryWrite;