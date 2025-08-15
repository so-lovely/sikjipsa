import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  Stack,
  Box,
  Badge,
  Image,
  SimpleGrid,
  ActionIcon,
  Alert,
  Center,
  Loader,
  Divider,
  Avatar,
  Modal
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconAlertCircle,
  IconPlant,
  IconCalendar,
  IconEye,
  IconTrashX,
  IconSeedling,
  IconLeaf,
  IconFlower,
  IconTree,
  IconMoon,
  IconNote,
  IconCamera
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { diaryAPI } from '../api/diary';

function DiaryDetail() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { diaryId, entryId } = useParams();
  
  const [diary, setDiary] = useState(null);
  const [entry, setEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const loadEntryDetail = async () => {
      try {
        setError(null);
        console.log('Loading diary and entry:', diaryId, entryId);
        
        // 다이어리 정보 로드
        const diaryData = await diaryAPI.getDiary(diaryId);
        console.log('DiaryData received:', diaryData);
        setDiary(diaryData);
        
        // 해당 엔트리 찾기
        const foundEntry = diaryData.entries?.find(e => e.id === parseInt(entryId));
        if (!foundEntry) {
          throw new Error('해당 일기를 찾을 수 없습니다.');
        }
        
        console.log('Found entry:', foundEntry);
        console.log('Entry images raw:', foundEntry.images);
        console.log('Entry images type:', typeof foundEntry.images);
        setEntry(foundEntry);
      } catch (error) {
        console.error('Error loading entry detail:', error);
        setError(error.message || '일기를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (diaryId && entryId) {
      loadEntryDetail();
    }
  }, [isLoggedIn, navigate, diaryId, entryId]);

  const handleBack = () => {
    navigate('/diary');
  };

  const handleEdit = () => {
    navigate(`/diary/edit/${diaryId}/${entryId}`);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    
    try {
      await diaryAPI.deleteEntry(diaryId, entryId);
      closeDelete();
      navigate('/diary');
    } catch (error) {
      console.error('Error deleting entry:', error);
      setError('일기 삭제에 실패했습니다.');
      closeDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const getGrowthStageText = (stage) => {
    const stageMap = {
      seedling: '새싹',
      growing: '성장중',
      flowering: '개화중', 
      mature: '성숙',
      dormant: '휴면'
    };
    return stageMap[stage] || '기록';
  };

  const getGrowthStageIcon = (stage) => {
    const icons = {
      seedling: <IconSeedling size={16} />,
      growing: <IconLeaf size={16} />,
      flowering: <IconFlower size={16} />,
      mature: <IconTree size={16} />,
      dormant: <IconMoon size={16} />
    };
    return icons[stage] || <IconNote size={16} />;
  };

  const getGrowthStageColor = (stage) => {
    const colors = {
      seedling: 'green',
      growing: 'teal',
      flowering: 'pink',
      mature: 'blue',
      dormant: 'gray'
    };
    return colors[stage] || 'gray';
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    open();
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

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handleBack}
          mb="xl"
          color="gray"
        >
          성장 일기로 돌아가기
        </Button>
        
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="오류가 발생했습니다"
          color="red"
          variant="light"
        >
          <Stack gap="md">
            <Text>{error}</Text>
            <Button
              variant="light"
              color="red"
              onClick={handleBack}
            >
              목록으로 돌아가기
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  if (!diary || !entry) {
    return (
      <Container size="lg" py="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handleBack}
          mb="xl"
          color="gray"
        >
          성장 일기로 돌아가기
        </Button>
        
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="일기를 찾을 수 없습니다"
          color="orange"
          variant="light"
        >
          <Stack gap="md">
            <Text>삭제되었거나 존재하지 않는 일기입니다.</Text>
            <Button
              variant="light"
              color="orange"
              onClick={handleBack}
            >
              목록으로 돌아가기
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  // 이미지 안전하게 파싱
  let images = [];
  console.log('Parsing images for entry:', entry.images, typeof entry.images);
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
    }
  } else {
    console.log('No images found in entry');
  }

  // plant 이미지 안전하게 파싱
  let plantImageSrc = null;
  if (diary.plant?.images) {
    try {
      const parsedImages = JSON.parse(diary.plant.images);
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        plantImageSrc = parsedImages[0];
      }
    } catch (e) {
      console.warn('Failed to parse plant images:', diary.plant.images);
    }
  }

  return (
    <Container size="lg" py="xl">
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={handleBack}
        mb="xl"
        color="gray"
      >
        성장 일기로 돌아가기
      </Button>

      <Card shadow="md" radius="lg" p="xl">
        {/* Plant Info Header */}
        <Stack gap="lg" mb="xl">
          <Group>
            <Avatar
              src={plantImageSrc}
              alt={diary.plant_nickname || diary.plant?.name}
              size="lg"
              radius="md"
              color="green"
            >
              <IconPlant size={32} />
            </Avatar>
            <div style={{ flex: 1 }}>
              <Title order={2} size="xl" c="green.7" mb="xs">
                {diary.plant_nickname || diary.plant?.name || '식물'}
              </Title>
              <Group gap="lg">
                <Group gap="xs">
                  <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
                  <Text size="sm" c="dimmed">
                    시작일: {new Date(diary.start_date).toLocaleDateString('ko-KR')}
                  </Text>
                </Group>
              </Group>
            </div>
          </Group>

          <Group justify="space-between" align="center">
            <Group gap="md">
              <Text size="lg" fw={600} c="gray.7">
                {new Date(entry.entry_date).toLocaleDateString('ko-KR', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </Text>
              <Badge
                color={getGrowthStageColor(entry.growth_stage)}
                variant="light"
                size="lg"
                leftSection={getGrowthStageIcon(entry.growth_stage)}
              >
                {getGrowthStageText(entry.growth_stage)}
              </Badge>
            </Group>
          </Group>
        </Stack>

        <Divider mb="xl" />

        {/* Entry Content */}
        <Stack gap="xl">
          {entry.title && (
            <Title order={1} size={32} fw={700} c="gray.8" lh={1.3}>
              {entry.title}
            </Title>
          )}
          
          <Text size="md" lh={1.8} c="gray.7" style={{ whiteSpace: 'pre-line' }}>
            {entry.content}
          </Text>

          {/* Entry Images */}
          {images.length > 0 && (
            <Box>
              <Group gap="xs" mb="md">
                <IconCamera size={20} color="var(--mantine-color-gray-8)" />
                <Title order={3} size="lg" c="gray.8">
                  사진 ({images.length}장)
                </Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {images.map((image, index) => (
                  <Box key={index} pos="relative">
                    <Image
                      src={image}
                      alt={`${diary.plant_nickname || '식물'} 사진 ${index + 1}`}
                      radius="md"
                      h={200}
                      style={{ 
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                      }}
                      styles={{
                        root: {
                          '&:hover': {
                            transform: 'scale(1.02)'
                          }
                        }
                      }}
                      onClick={() => handleImageClick(image)}
                      fallbackSrc="https://via.placeholder.com/200x200?text=이미지+없음"
                    />
                    <ActionIcon
                      variant="filled"
                      color="dark"
                      size="sm"
                      radius="xl"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        opacity: 0.8
                      }}
                      onClick={() => handleImageClick(image)}
                    >
                      <IconEye size={14} />
                    </ActionIcon>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Stack>

        <Divider my="xl" />

        {/* Action Buttons */}
        <Group justify="flex-end" gap="md">
          <Button
            variant="light"
            color="blue"
            leftSection={<IconEdit size={16} />}
            onClick={handleEdit}
          >
            수정하기
          </Button>
          <Button
            variant="light"
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={openDelete}
          >
            삭제하기
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'green.5', to: 'green.6' }}
            onClick={handleBack}
          >
            목록으로
          </Button>
        </Group>
      </Card>

      {/* Image Modal */}
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
              objectFit: 'contain'
            }}
            onClick={() => {
              close();
              setSelectedImage(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="일기 삭제"
        centered
        size="md"
      >
        <Stack gap="lg">
          <Group>
            <IconTrashX size={48} color="var(--mantine-color-red-6)" />
            <Box>
              <Title order={4} c="red.6" mb="xs">
                정말로 이 일기를 삭제하시겠습니까?
              </Title>
              <Text size="sm" c="dimmed">
                삭제된 일기는 복구할 수 없습니다.
              </Text>
            </Box>
          </Group>
          
          {entry && (
            <Box 
              p="md" 
              style={{
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 'var(--mantine-radius-md)',
                border: '1px solid var(--mantine-color-gray-3)'
              }}
            >
              <Text size="sm" fw={500} mb="xs">
                {entry.title || '제목 없음'}
              </Text>
              <Text size="xs" c="dimmed" mb="sm">
                {new Date(entry.entry_date).toLocaleDateString('ko-KR')}
              </Text>
              <Text size="sm" c="gray.7" style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {entry.content}
              </Text>
            </Box>
          )}

          <Group justify="flex-end" gap="sm">
            <Button
              variant="light"
              color="gray"
              onClick={closeDelete}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              color="red"
              onClick={handleDeleteConfirm}
              loading={isDeleting}
              leftSection={!isDeleting ? <IconTrash size={16} /> : null}
            >
              {isDeleting ? '삭제 중...' : '삭제하기'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

export default DiaryDetail;