import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Avatar,
  TextInput,
  Alert,
  Divider,
  Badge,
  Center,
  Loader
} from '@mantine/core';
import { IconUser, IconEdit, IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../api/auth.js';

function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    username: user?.username || ''
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = { username: formData.username };
      console.log('Updating profile with:', updateData);
      
      const response = await authAPI.updateProfile(updateData);
      
      login(response.user);
      setMessage({ type: 'success', text: '닉네임이 성공적으로 업데이트되었습니다!' });
      setIsEditing(false);
      
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || '프로필 업데이트에 실패했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || ''
    });
    setIsEditing(false);
    setMessage({ type: '', text: '' });
  };

  const getSocialProviderIcon = (provider) => {
    switch (provider) {
      case 'naver': return '🟢';
      case 'kakao': return '💛';
      default: return '🔗';
    }
  };

  const getSocialProviderColor = (provider) => {
    switch (provider) {
      case 'naver': return 'green';
      case 'kakao': return 'yellow';
      default: return 'blue';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container size="md" py="xl">
      {/* Hero Section */}
      <Stack align="center" gap="xl" mb={60}>
        <Title order={1} size={48} fw={700} ta="center" c="gray.8">
          👤 <Text component="span" c="green.6">내 프로필</Text>
        </Title>
        <Text size="lg" ta="center" c="gray.6" maw={600}>
          계정 정보를 관리하고 설정을 변경하세요
        </Text>
      </Stack>

      {/* Profile Info Card */}
      <Card shadow="md" radius="lg" p="xl" mb="xl">
        <Stack gap="lg">
          <Title order={2} size="xl" c="green.7" mb="lg">
            기본 정보
          </Title>
          
          <Group>
            <Avatar
              src={user.profile_image}
              alt={user.username}
              size="xl"
              radius="xl"
              color="green"
            >
              <IconUser size={48} />
            </Avatar>
            
            <div style={{ flex: 1 }}>
              <Title order={3} size="lg" fw={600} c="gray.8" mb="xs">
                {user.username || '닉네임이 설정되지 않았습니다'}
              </Title>
              <Text size="md" c="gray.6" mb="xs">
                {user.email}
              </Text>
              <Text size="sm" c="dimmed">
                가입일: {formatDate(user.created_at)}
              </Text>
            </div>
          </Group>

          {user.social_provider && (
            <Alert
              icon={getSocialProviderIcon(user.social_provider)}
              color={getSocialProviderColor(user.social_provider)}
              variant="light"
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={500}>
                    {user.social_provider.toUpperCase()} 계정으로 연결됨
                  </Text>
                  <Text size="sm" c="dimmed">
                    소셜 로그인을 통해 간편하게 로그인할 수 있습니다.
                  </Text>
                </div>
                <Badge
                  color={getSocialProviderColor(user.social_provider)}
                  variant="light"
                >
                  연결됨
                </Badge>
              </Group>
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Profile Settings Card */}
      <Card shadow="md" radius="lg" p="xl">
        <Stack gap="lg">
          <Title order={2} size="xl" c="green.7">
            계정 설정
          </Title>
          
          {message.text && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color={message.type === 'success' ? 'green' : 'red'}
              variant="light"
            >
              {message.text}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <TextInput
                label="닉네임"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder={isEditing ? "닉네임을 입력하세요" : (user?.username || "닉네임이 설정되지 않았습니다")}
                required={isEditing}
                minLength={2}
                maxLength={50}
                description={isEditing ? "2-50자 사이로 입력해주세요" : undefined}
                leftSection={<IconUser size={16} />}
              />

              <Group justify="flex-end" gap="md">
                {isEditing ? (
                  <>
                    <Button
                      variant="light"
                      color="gray"
                      onClick={handleCancel}
                      disabled={isLoading}
                      leftSection={<IconX size={16} />}
                    >
                      취소
                    </Button>
                    <Button
                      type="submit"
                      variant="gradient"
                      gradient={{ from: 'green.5', to: 'green.6' }}
                      disabled={isLoading}
                      leftSection={isLoading ? <Loader size={16} /> : <IconCheck size={16} />}
                    >
                      {isLoading ? '저장 중...' : '저장하기'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="gradient"
                    gradient={{ from: 'green.5', to: 'green.6' }}
                    onClick={() => setIsEditing(true)}
                    leftSection={<IconEdit size={16} />}
                  >
                    수정하기
                  </Button>
                )}
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Container>
  );
}

export default Profile;