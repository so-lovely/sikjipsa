import React, { useState, useRef } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Card,
  SimpleGrid,
  Box,
  Stack,
  Image,
  Badge,
  Alert,
  Loader,
  Center,
  rem,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { IconUpload, IconPhoto, IconX, IconCheck, IconAlertTriangle, IconRobot, IconSeedling, IconSearch, IconZoomScan, IconBolt, IconPill, IconBulb, IconEye } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { diagnosisAPI } from '../api/diagnosis';

// Constants
const MAX_FILE_SIZE = 10 * 1024 ** 2; // 5MB
const ACCEPTED_IMAGE_TYPES = IMAGE_MIME_TYPE;

const HEALTH_STATUS_CONFIG = {
  healthy: { 
    color: 'green', 
    icon: <IconCheck size={16} />, 
    label: '건강함' 
  },
  warning: { 
    color: 'yellow', 
    icon: <IconAlertTriangle size={16} />, 
    label: '주의 필요' 
  },
  critical: { 
    color: 'red', 
    icon: <IconX size={16} />, 
    label: '치료 필요' 
  }
};

const FEATURES = [
  {
    icon: <IconZoomScan size={32} color="var(--mantine-color-green-6)" stroke={1.5} />,
    title: 'AI 정확도 95%',
    description: '최신 딥러닝 기술로 식물의 종류와 상태를 정확하게 분석합니다.'
  },
  {
    icon: <IconBolt size={32} color="var(--mantine-color-blue-6)" stroke={1.5} />,
    title: '즉시 진단',
    description: '사진 업로드 후 몇 초 내에 결과를 확인할 수 있습니다.'
  },
  {
    icon: <IconPill size={32} color="var(--mantine-color-teal-6)" stroke={1.5} />,
    title: '맞춤 처방',
    description: '진단 결과에 따른 구체적인 관리 방법을 제시해드립니다.'
  }
];

// Sub-components
const HeroSection = () => (
  <Stack align="center" gap="xl" mb={60}>
    <Title order={1} size={48} fw={700} ta="center" c="gray.8">
      <IconRobot size={48} color="var(--mantine-color-green-6)" stroke={1.5} style={{ display: 'inline', marginRight: 12 }} />
      <Text component="span" c="green.6">AI 식물 진단</Text>
    </Title>
    <Text size="lg" ta="center" c="gray.6" maw={600}>
      최신 인공지능 기술로 식물명과 식물의 건강 상태를 정확하게 진단하세요
    </Text>
  </Stack>
);

const ImageDropzone = ({ onFileSelect, onReject }) => {
  const openRef = useRef(null);

  return (
    <Stack gap="sm">
      <Dropzone
        openRef={openRef}
        onDrop={onFileSelect}
        onReject={onReject}
        maxSize={MAX_FILE_SIZE}
        accept={ACCEPTED_IMAGE_TYPES}
        style={{
          border: '2px dashed var(--mantine-color-green-4)',
          borderRadius: 'var(--mantine-radius-lg)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
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
              식물 사진을 업로드하세요
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

      {/* 진단하기 버튼: 드롭존을 프로그램matically 오픈 */}
      <Group justify="center" mt="xs">
        <Button
          size="md"
          variant="gradient"
          gradient={{ from: 'green.5', to: 'green.6' }}
          leftSection={<IconSeedling size={16} />}
          onClick={() => openRef.current?.()}
        >
          진단하기
        </Button>
      </Group>
    </Stack>
  );
};

const ImagePreview = ({ image, onDiagnose, onClear, isLoading, isLoggedIn }) => (
  <Stack align="center" gap="md">
    <Image
      src={image.preview}
      alt="Selected plant"
      maw={400}
      radius="md"
      style={{ maxHeight: 400 }}
    />
    <Group gap="md">
      <Button
        variant="gradient"
        gradient={{ from: 'green.5', to: 'green.6' }}
        leftSection={<IconSearch size={16} />}
        onClick={onDiagnose}
        loading={isLoading}
        disabled={!isLoggedIn}
        size="md"
      >
        AI 진단 시작
      </Button>
      <Button
        variant="light"
        color="gray"
        onClick={onClear}
        size="md"
      >
        다른 사진 선택
      </Button>
    </Group>
    {!isLoggedIn && (
      <Text size="sm" c="dimmed" ta="center">
        진단을 받으려면 로그인이 필요합니다
      </Text>
    )}
  </Stack>
);

const LoadingState = () => (
  <Card shadow="md" radius="lg" mb="xl">
    <Center py="xl">
      <Stack align="center" gap="md">
        <Loader color="green" size="lg" />
        <Text size="lg" fw={600} c="gray.7">
          AI가 식물을 분석하고 있습니다...
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          잠시만 기다려주세요. 곧 결과를 확인할 수 있습니다.
        </Text>
      </Stack>
    </Center>
  </Card>
);

const normalizeConfidence = (val) => {
  if (val == null) return null;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace('%', '').trim());
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  if (typeof val === 'number') {
    if (val >= 0 && val <= 1) return Math.round(val * 100);
    if (val >= 0 && val <= 100) return Math.round(val);
  }
  return null;
};


const DiagnosisResults = ({ result }) => {
  const rawConfidence = result?.confidence ?? result?.score ?? result?.probability ?? null;
  const confidence = normalizeConfidence(rawConfidence);

  // 80 미만이면 오직 한 줄 텍스트만 렌더
  if (confidence != null && confidence < 80) {
    return (
      <Card shadow="md" radius="lg" mb="xl">
        <Center style={{ padding: '1.5rem' }}>
          <Text size="lg" fw={700} c="red.6">
            식물이 식별되지 않았어요
          </Text>
        </Center>
      </Card>
    );
  }

  // confidence가 없거나 >= 80이면 기존 결과 전체 렌더(필요없으면 아래 블록 삭제)
  const statusConfig = HEALTH_STATUS_CONFIG[result?.healthStatus] || HEALTH_STATUS_CONFIG.healthy;
  const plantName = result?.plantName ?? '알 수 없는 식물';

  return (
    <Card shadow="md" radius="lg" mb="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} size="xl" c="gray.8" mb="xs">진단 결과</Title>
            <Text size="lg" fw={600} c="green.6" mb="sm">{plantName}</Text>
            <Text size="sm" c="dimmed">
              {confidence == null ? '정확도 정보를 받을 수 없습니다' : `정확도: ${confidence}%`}
            </Text>
          </div>

          <Badge color={statusConfig.color} size="lg" variant="light" leftSection={statusConfig.icon}>
            {statusConfig.label}
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {result?.issues?.length > 0 && (
            <ResultSection title={<Group gap="xs"><IconEye size={16} color="var(--mantine-color-orange-6)" />발견된 문제점</Group>} items={result.issues} color="orange.6" />
          )}

          {result?.recommendations?.length > 0 && (
            <ResultSection title={<Group gap="xs"><IconBulb size={16} color="var(--mantine-color-green-6)" />관리 방법</Group>} items={result.recommendations} color="green.6" />
          )}
        </SimpleGrid>
      </Stack>
    </Card>
  );
};

const ResultSection = ({ title, items, color }) => (
  <Box>
    <Title order={4} size="md" c={color} mb="sm">
      {title}
    </Title>
    <Stack gap="xs">
      {items.map((item, index) => (
        <Group key={index} align="flex-start" gap="sm">
          <Text c={color} fw={600}>•</Text>
          <Text size="sm" c="gray.7" style={{ flex: 1 }}>
            {item}
          </Text>
        </Group>
      ))}
    </Stack>
  </Box>
);

// The FeatureCard component was unused, so it has been removed for cleaner code.

// REFACTORED FeaturesSection
const FeaturesSection = () => (
  // 1. Added a significant, responsive top margin to create the large vertical space
  //    seen in the reference image, separating this section from the content above.
  // 2. Simplified the structure by removing the unnecessary outer Box and Container.
  // 3. Increased the gap between the title and the grid for better visual hierarchy.
  <Stack mt={{ base: 80, sm: 120 }} align="center" gap="xl">
    <Title order={2} size={28} fw={700} ta="center" c="gray.8">
      🌟 AI 진단의 특별한 점
    </Title>
    <SimpleGrid
      cols={{ base: 1, sm: 3 }}
      spacing={{ base: 'lg', sm: 'xl' }}
      verticalSpacing="lg"
      w="100%"
    >
      {FEATURES.map((feature) => (
        // 4. Refined the layout of each feature item for better alignment and readability.
        <Group key={feature.title} align="flex-start" gap="md" wrap="nowrap">
          <Box mt={4}>{feature.icon}</Box>
          <Stack gap={4}>
            <Text fz="md" fw={600} c="gray.8">
              {feature.title}
            </Text>
            <Text fz="sm" c="dimmed">
              {feature.description}
            </Text>
          </Stack>
        </Group>
      ))}
    </SimpleGrid>
  </Stack>
);


// Custom hooks
const useDiagnosis = () => {
  const { isLoggedIn } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const handleFileSelect = async (files) => {
    if (files.length === 0) return;
    
    const file = files[0];
    try {
      diagnosisAPI.validateImageFile(file);
      const preview = await diagnosisAPI.fileToBase64(file);
      
      setSelectedImage({ file, preview });
      setDiagnosisResult(null);
      setError(null);
    } catch (error) {
      setError(error.message);
      setSelectedImage(null);
    }
  };

  const handleDiagnosis = async () => {
    if (!selectedImage || !isLoggedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await diagnosisAPI.analyzePlant(selectedImage.file, userLocation);
      setDiagnosisResult(result);
    } catch (error) {
      console.error('Diagnosis error:', error);
      setError(error.message || '진단 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setDiagnosisResult(null);
    setError(null);
  };

  const handleReject = () => {
    setError('지원하지 않는 파일 형식이거나 파일이 너무 큽니다.');
  };

  return {
    isLoggedIn,
    selectedImage,
    diagnosisResult,
    isLoading,
    error,
    handleFileSelect,
    handleDiagnosis,
    clearImage,
    handleReject
  };
};

// Main component
function Diagnosis() {
  const {
    isLoggedIn,
    selectedImage,
    diagnosisResult,
    isLoading,
    error,
    handleFileSelect,
    handleDiagnosis,
    clearImage,
    handleReject
  } = useDiagnosis();

  return (
    <Container size="lg" py="xl">
      <HeroSection />

      {/* Upload Section */}
      <Card shadow="md" radius="lg" mb="xs" p="xl">
        {!selectedImage ? (
          <ImageDropzone 
            onFileSelect={handleFileSelect} 
            onReject={handleReject} 
          />
        ) : (
          <ImagePreview
            image={selectedImage}
            onDiagnose={handleDiagnosis}
            onClear={clearImage}
            isLoading={isLoading}
            isLoggedIn={isLoggedIn}
          />
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="오류 발생"
          color="red"
          mb="xl"
          variant="light"
        >
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <LoadingState />}

      {/* Results Section */}
      {diagnosisResult && !isLoading && (
        <DiagnosisResults result={diagnosisResult} />
      )}

      {/* Features Section */}
      <FeaturesSection />
    </Container>
  );
}

export default Diagnosis;