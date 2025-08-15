import React, { useState, useEffect } from 'react';
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
  Badge,
  Modal,
  Image,
  Tabs,
  ScrollArea,
  Loader,
  Center,
  Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertCircle, IconBook, IconSearch } from '@tabler/icons-react';
import { plantAPI } from '../api/plants.js';

function Encyclopedia() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [plants, setPlants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plantsData, categoriesData] = await Promise.all([
        plantAPI.getAllPlants(),
        plantAPI.getCategories()
      ]);
      
      setPlants(plantsData);
      
      // Add "all" category at the beginning
      const allCategories = [
        { id: 'all', name: '전체' },
        ...categoriesData
      ];
      setCategories(allCategories);
    } catch (error) {
      console.error('Failed to load plants:', error);
      setError('식물 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = plants.filter(plant => {
    const matchesCategory = selectedCategory === 'all' || plant.category_id === selectedCategory;
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const parseImages = (images) => {
    if (!images) return [];
    try {
      return typeof images === 'string' ? JSON.parse(images) : images;
    } catch (e) {
      return [];
    }
  };

  const getFirstImage = (plant) => {
    const images = parseImages(plant.images);
    const originalUrl = images.length > 0 ? images[0] : 'https://via.placeholder.com/400x250?text=🌱';
    
    // Add Cloudinary optimization without resizing
    if (originalUrl.includes('cloudinary.com')) {
      // Insert optimization parameters before the version or image path
      const optimizedUrl = originalUrl.replace(
        /\/v\d+\//, 
        '/f_auto,q_auto/v1/'
      ).replace(
        /\/upload\//,
        '/upload/f_auto,q_auto/'
      );
      return optimizedUrl;
    }
    
    return originalUrl;
  };

  const parseCareInstructions = (instructions) => {
    if (!instructions) return {};
    try {
      // If it's already an object, return it
      if (typeof instructions === 'object') return instructions;
      // If it's a JSON string, parse it
      if (typeof instructions === 'string' && instructions.startsWith('{')) {
        return JSON.parse(instructions);
      }
      // If it's a plain text, return it as description
      return { description: instructions };
    } catch (e) {
      return { description: instructions };
    }
  };

  const handlePlantClick = (plant) => {
    setSelectedPlant(plant);
    open();
  };

  const getCategoryColor = (categoryId) => {
    const colors = {
      1: 'green',    // 관엽식물
      2: 'teal',     // 다육식물
      3: 'blue',     // 허브
      4: 'grape'     // 화훼식물
    };
    return colors[categoryId] || 'gray';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '기타';
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader color="green" size="lg" />
            <Text size="lg" fw={600} c="gray.7">
              식물 데이터를 불러오는 중...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
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
              onClick={loadData}
            >
              다시 시도
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      {/* Hero Section */}
      <Stack align="center" gap="xl" mb={60}>
        <Title order={1} size={48} fw={700} ta="center" c="gray.8">
          <IconBook size={48} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
          <Text component="span" c="green.6">식물 백과사전</Text>
        </Title>
        <Text size="lg" ta="center" c="gray.6" maw={600}>
          다양한 식물들의 상세한 정보와 전문적인 관리 방법을 
          한 곳에서 확인하세요
        </Text>

        {/* Search Section */}
        <Group maw={600} w="100%">
          <TextInput
            placeholder="식물 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="md"
            style={{ flex: 1 }}
            leftSection={<IconSearch size={16} />}
          />
        </Group>
      </Stack>

      {/* Category Tabs */}
      <ScrollArea type="never" mb="xl">
        <Group gap="xs" style={{ minWidth: 'max-content' }}>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'filled' : 'light'}
              color="green"
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {category.name}
            </Button>
          ))}
        </Group>
      </ScrollArea>

      {/* Plant Grid */}
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing="xl"
      >
        {filteredPlants.map((plant) => (
          <Card
            key={plant.id}
            shadow="md"
            radius="lg"
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}
            styles={{
              root: {
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04)'
                }
              }
            }}
            onClick={() => handlePlantClick(plant)}
          >
            <Card.Section>
              <Image
                src={getFirstImage(plant)}
                height={250}
                alt={plant.name}
                fallbackSrc="https://via.placeholder.com/400x250?text=🌱"
              />
            </Card.Section>

            <Stack gap="sm" p="md">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={3} size="lg" fw={600} c="gray.8">
                    {plant.name}
                  </Title>
                  <Text size="sm" c="gray.5" fs="italic">
                    {plant.scientific_name || ''}
                  </Text>
                </div>
                <Badge
                  color={getCategoryColor(plant.category_id)}
                  variant="light"
                  size="sm"
                >
                  {getCategoryName(plant.category_id)}
                </Badge>
              </Group>

              <Text size="sm" c="gray.6" lineClamp={3}>
                {plant.description}
              </Text>

              <Button
                variant="light"
                color="green"
                size="sm"
                rightSection="→"
                mt="xs"
              >
                자세히 보기
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Plant Detail Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={selectedPlant ? (
          <Group>
            <div>
              <Title order={2} size="xl" c="gray.8">
                {selectedPlant.name}
              </Title>
              <Text size="sm" c="gray.5" fs="italic">
                {selectedPlant.scientific_name || ''}
              </Text>
            </div>
          </Group>
        ) : ''}
        size="lg"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedPlant && (
          <Stack gap="lg">
            <Image
              src={getFirstImage(selectedPlant)}
              height={300}
              radius="md"
              alt={selectedPlant.name}
            />

            <Text c="gray.7" lh={1.6}>
              {selectedPlant.description}
            </Text>

            <Tabs defaultValue="care" color="green">
              <Tabs.List>
                <Tabs.Tab value="care" leftSection="🌱">
                  관리법
                </Tabs.Tab>
                <Tabs.Tab value="details" leftSection="💡">
                  상세정보
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="care" pt="lg">
                <Stack gap="md">
                  <Text c="gray.7" lh={1.6}>
                    {selectedPlant.care_instructions || '관리 방법 정보가 없습니다.'}
                  </Text>
                  
                  {selectedPlant.light_requirement && (
                    <Box>
                      <Text fw={600} size="sm" c="gray.8" mb="xs">
                        💡 조명 요구사항
                      </Text>
                      <Text size="sm" c="gray.6">
                        {selectedPlant.light_requirement}
                      </Text>
                    </Box>
                  )}
                  
                  {selectedPlant.water_frequency && (
                    <Box>
                      <Text fw={600} size="sm" c="gray.8" mb="xs">
                        💧 물주기 빈도
                      </Text>
                      <Text size="sm" c="gray.6">
                        {selectedPlant.water_frequency}
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="details" pt="lg">
                <Stack gap="md">
                  {selectedPlant.difficulty_level && (
                    <Box>
                      <Text fw={600} size="sm" c="gray.8" mb="xs">
                        키우기 난이도
                      </Text>
                      <Text size="sm" c="gray.6">
                        {selectedPlant.difficulty_level === 'easy' && '쉬움'}
                        {selectedPlant.difficulty_level === 'medium' && '보통'}
                        {selectedPlant.difficulty_level === 'hard' && '어려움'}
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}

export default Encyclopedia;