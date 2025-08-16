import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Card,
  SimpleGrid,
  Box,
  Stack,
  Image,
  Select,
  Loader,
  Center,
  Alert,
  Modal,
  ActionIcon
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconPlus, IconAlertCircle, IconEye, IconNotebook, IconSeedling, IconLeaf, IconFlower, IconTree, IconMoon, IconNote } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { diaryAPI } from '../api/diary';

function Diary() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedDiary, setSelectedDiary] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    const loadDiariesAndEntries = async () => {
      try {
        setError(null);
        const diariesData = await diaryAPI.getUserDiaries();
        
        if (!Array.isArray(diariesData)) {
          throw new Error('Invalid diaries data format');
        }
        
        setDiaries(diariesData);
        
        // 모든 엔트리를 하나의 배열로 합치기
        const entries = [];
        console.log('Processing diaries data:', diariesData);
        diariesData.forEach((diary) => {
          console.log('Processing diary:', diary.id, diary.entries);
          if (diary.entries && Array.isArray(diary.entries) && diary.entries.length > 0) {
            diary.entries.forEach((entry) => {
              console.log('Processing entry:', entry.id, 'images:', entry.images, typeof entry.images);
              try {
                // plant 이미지 안전하게 파싱
                let plantImage = null;
                if (diary.plant?.images) {
                  try {
                    const parsedImages = JSON.parse(diary.plant.images);
                    plantImage = Array.isArray(parsedImages) ? parsedImages[0] : null;
                  } catch (e) {
                    console.warn('Failed to parse plant images:', diary.plant.images);
                  }
                }
                
                entries.push({
                  ...entry,
                  diaryId: diary.id,
                  plantNickname: diary.plant_nickname || '식물',
                  plantName: diary.plant?.name || '식물',
                  categoryName: diary.plant?.category?.name || '',
                  plantImage: plantImage
                });
              } catch (entryError) {
                console.error('Error processing entry:', entryError, entry);
              }
            });
          }
        });
        
        // 날짜순으로 정렬 (최신순)
        entries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
        
        setAllEntries(entries);
        setFilteredEntries(entries);
      } catch (error) {
        console.error('Error loading diaries:', error);
        setError('다이어리를 불러오는데 실패했습니다: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiariesAndEntries();
  }, [isLoggedIn]);

  useEffect(() => {
    let filtered = allEntries;

    // 다이어리 필터 (식물별)
    if (selectedDiary !== 'all') {
      filtered = filtered.filter(entry => entry.diaryId === parseInt(selectedDiary));
    }

    // 활동 필터  
    if (selectedActivity !== 'all') {
      filtered = filtered.filter(entry => entry.growth_stage === selectedActivity);
    }

    // 검색 필터
    if (searchTerm.trim()) {
      filtered = filtered.filter(entry => 
        (entry.content && entry.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.title && entry.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.plantNickname && entry.plantNickname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.plantName && entry.plantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.categoryName && entry.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredEntries(filtered);
  }, [allEntries, selectedDiary, selectedActivity, searchTerm]);

  const handleAddEntry = () => {
    navigate('/diary/write');
  };


  const handleEntryClick = (entry) => {
    navigate(`/diary/${entry.diaryId}/${entry.id}`);
  };

  const getActivityIcon = (growthStage) => {
    const icons = {
      seedling: <IconSeedling size={16} color="var(--mantine-color-green-6)"/>,
      growing: <IconLeaf size={16} color="var(--mantine-color-green-6)"/>,
      flowering: <IconFlower size={16} color="var(--mantine-color-pink-6)"/>,
      mature: <IconTree size={16} color="var(--mantine-color-green-7)"/>,
      dormant: <IconMoon size={16} color="var(--mantine-color-gray-6)"/>
    };
    return icons[growthStage] || <IconNote size={16} />;
  };

  const handleImageClick = (image, e) => {
    e.stopPropagation(); // Prevent entry click
    setSelectedImage(image);
    open();
  };


  // 로그인하지 않은 경우
  if (!isLoggedIn) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center" gap="xl">
          <Title order={1} size={48} fw={700} ta="center" c="gray.8">
            <IconNotebook size={48} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
            <Text component="span" c="green.6">성장 일기</Text>
          </Title>
          <Text size="lg" ta="center" c="gray.6" maw={600}>
            로그인 후 내 식물들의 성장 일기를 작성해보세요
          </Text>
          <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
            <Stack align="center" gap="sm">
              <Text size="lg" c="gray.6">
                로그인이 필요한 서비스입니다
              </Text>
              <Button
                variant="gradient"
                gradient={{ from: 'green.5', to: 'green.6' }}
                onClick={() => navigate('/login')}
              >
                로그인하기
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Hero Section */}
      <Stack align="center" gap="xl" mb={60}>
        <Title order={1} size={48} fw={700} ta="center" c="gray.8">
          <IconNotebook size={48} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
          <Text component="span" c="green.6">성장 일기</Text>
        </Title>
        <Text size="lg" ta="center" c="gray.6" maw={600}>
          내 식물들의 소중한 성장 순간을 기록하고 
          추억을 쌓아가세요
        </Text>
      </Stack>

      {/* Stats Section */}

      {/* Header Controls */}
      <Group justify="flex-end" mb="xl">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAddEntry}
          variant="gradient"
          gradient={{ from: 'green.5', to: 'green.6' }}
        >
          일기 쓰기
        </Button>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="오류 발생"
          color="red"
          mb="xl"
          variant="light"
        >
          {error}
          <Button
            variant="light"
            color="red"
            size="xs"
            mt="sm"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </Button>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Center py="xl">
          <Loader color="green" size="lg" />
        </Center>
      )}


      {/* Timeline View */}
      {!isLoading && (
        <div>
          <Group gap="xs" mb="lg">
            <IconNotebook size={24} color="var(--mantine-color-green-6)" />
            <Title order={2} size="xl" c="gray.8">
              성장 기록
            </Title>
          </Group>
          
          {/* Filters */}
          <Group mb="xl" align="flex-end">
            <Select
              label="식물 선택"
              placeholder="모든 식물"
              value={selectedDiary}
              onChange={setSelectedDiary}
              data={[
                { value: 'all', label: '모든 식물' },
                ...diaries.map(diary => ({
                  value: diary.id.toString(),
                  label: `${diary.plant_nickname || '식물'} (${diary.plant?.category?.name || diary.plant?.name || '식물'})`
                }))
              ]}
              maw={200}
            />
            
            <Select
              label="성장단계"
              placeholder="모든 성장단계"
              value={selectedActivity}
              onChange={setSelectedActivity}
              data={[
                { value: 'all', label: '모든 성장단계' },
                { value: 'seedling', label: '새싹' },
                { value: 'growing', label: '성장중' },
                { value: 'flowering', label: '개화중' },
                { value: 'mature', label: '성숙' },
                { value: 'dormant', label: '휴면' }
              ]}
              maw={200}
            />

            <TextInput
              label="검색"
              placeholder="기록 내용으로 검색..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
          </Group>

          {/* Timeline Entries */}
          {filteredEntries.length > 0 ? (
            <SimpleGrid cols={1} spacing="md">
              {filteredEntries.map(entry => {
                // 이미지 안전하게 파싱
                let images = [];
                console.log('Timeline entry images:', entry.images, typeof entry.images);
                if (entry.images) {
                  try {
                    // If it's already an array, use it directly
                    if (Array.isArray(entry.images)) {
                      images = entry.images;
                      console.log('Images already parsed as array:', images);
                    } else if (typeof entry.images === 'string') {
                      const parsed = JSON.parse(entry.images);
                      images = Array.isArray(parsed) ? parsed : [];
                      console.log('Images parsed from string:', images);
                    } else {
                      console.log('Unknown image format:', typeof entry.images, entry.images);
                    }
                  } catch (e) {
                    console.warn('Failed to parse entry images:', entry.images, e);
                    images = [];
                  }
                } else {
                  console.log('No images found in timeline entry');
                }
                const activityIcon = getActivityIcon(entry.growth_stage);
                
                return (
                  <Card
                    key={entry.id}
                    shadow="sm"
                    radius="lg"
                    padding="lg"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }}
                    onClick={() => handleEntryClick(entry)}
                  >
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Title order={3} size="lg" fw={600} c="green.7" mb="xs">
                            {entry.plantNickname} {entry.categoryName && `(${entry.categoryName})`}
                          </Title>
                          <Text size="sm" c="dimmed" mb="sm">
                            {new Date(entry.entry_date).toLocaleDateString('ko-KR')}
                          </Text>
                          <Group gap="sm" mb="sm">
                            <div>{activityIcon}</div>
                            <Text size="sm" fw={500} c="gray.8">
                              {entry.growth_stage || '기록'}
                            </Text>
                          </Group>
                          {entry.title && (
                            <Text fw={600} size="md" mb="xs" c="gray.8">
                              {entry.title}
                            </Text>
                          )}
                          <Text c="gray.6" lh={1.6}>
                            {entry.content}
                          </Text>
                        </div>
                      </Group>
                      
                      {images.length > 0 && (
                        <Group gap="sm" mt="sm">
                          {images.slice(0, 4).map((image, index) => (
                            <Box key={index} pos="relative">
                              <Image
                                src={image}
                                alt={`${entry.plantNickname} 사진 ${index + 1}`}
                                w={100}
                                h={100}
                                radius="md"
                                style={{ 
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease'
                                }}
                                styles={{
                                  root: {
                                    '&:hover': {
                                      transform: 'scale(1.05)'
                                    }
                                  }
                                }}
                                onClick={(e) => handleImageClick(image, e)}
                                fallbackSrc="https://via.placeholder.com/100x100?text=이미지+없음"
                              />
                              <ActionIcon
                                variant="filled"
                                color="dark"
                                size="sm"
                                radius="xl"
                                style={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  opacity: 0.8,
                                  transition: 'opacity 0.2s ease'
                                }}
                                onClick={(e) => handleImageClick(image, e)}
                              >
                                <IconEye size={12} />
                              </ActionIcon>
                            </Box>
                          ))}
                          {images.length > 4 && (
                            <Box
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 'var(--mantine-radius-md)',
                                background: 'var(--mantine-color-gray-2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to detail view to see all images
                                handleEntryClick(entry);
                              }}
                              styles={{
                                '&:hover': {
                                  background: 'var(--mantine-color-gray-3)',
                                  transform: 'scale(1.02)'
                                }
                              }}
                            >
                              <Stack align="center" gap={2}>
                                <IconEye size={16} color="var(--mantine-color-gray-6)" />
                                <Text size="xs" c="dimmed" fw={600}>
                                  +{images.length - 4}
                                </Text>
                              </Stack>
                            </Box>
                          )}
                        </Group>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          ) : (
            <Card shadow="sm" radius="md" padding="xl" style={{ textAlign: 'center' }}>
              <Stack align="center" gap="md">
                <IconNotebook size={48} color="var(--mantine-color-gray-6)" />
                <Title order={3} c="gray.6">
                  기록이 없습니다
                </Title>
                <Text c="dimmed">
                  첫 번째 성장 일기를 작성해보세요!
                </Text>
                <Button
                  variant="gradient"
                  gradient={{ from: 'green.5', to: 'green.6' }}
                  onClick={handleAddEntry}
                >
                  일기 쓰기
                </Button>
              </Stack>
            </Card>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setSelectedImage(null);
        }}
        size="xl"
        centered
        withCloseButton={false}
        padding={0}
        styles={{
          content: {
            background: 'transparent'
          },
          body: {
            padding: 0
          }
        }}
      >
        {selectedImage && (
          <Image
            src={selectedImage}
            alt="확대된 사진"
            style={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              objectFit: 'contain',
              cursor: 'pointer'
            }}
            onClick={() => {
              close();
              setSelectedImage(null);
            }}
          />
        )}
      </Modal>
    </Container>
  );
}

export default Diary;