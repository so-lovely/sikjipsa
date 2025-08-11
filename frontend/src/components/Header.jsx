import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Group, 
  Text, 
  Button, 
  Burger,
  Drawer,
  Stack,
  Anchor,
  Badge
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  IconBook, 
  IconRobot, 
  IconMessages, 
  IconNotebook,
  IconPlant,
  IconSeedling,
  IconUserCircle,
  IconSpeakerphone
} from '@tabler/icons-react';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoggedIn } = useAuth();
  const [opened, { toggle, close }] = useDisclosure(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  const handleNavClick = (path) => {
    navigate(path);
    close();
  };

  const navItems = [
    { path: '/encyclopedia', label: <IconBook size={36} /> },
    { path: '/diagnosis', label: <IconRobot size={36} /> },
    { path: '/community', label: <IconMessages size={36} /> },
    { path: '/announcements', label: <IconSpeakerphone size={36} /> },
    { path: '/diary', label: <IconNotebook size={36} /> }
  ];

  return (
    <Box 
      component="header"
      h={60}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--mantine-color-gray-3)'
      }}
    >
      <Container size="lg" h="100%">
        <Group justify="space-between" h="100%">
          {/* Logo Section */}
          <Group>
            <Anchor 
              component={Link} 
              to="/" 
              style={{ textDecoration: 'none' }}
            >
              <Group gap="xs">
                <Text size="xl"><IconSeedling stroke={2} width={32} height={32}/></Text>
                <Text 
                  size="xl" 
                  fw={700} 
                  c="green.6"
                >
                  식집사
                </Text>
              </Group>
            </Anchor>
          </Group>

          {/* Desktop Navigation */}
          <Group visibleFrom="md" gap="xs">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'light' : 'subtle'}
                color="green"
                size="sm"
                component={Link}
                to={item.path}
              >
                {item.label}
              </Button>
            ))}
          </Group>

          {/* User Section */}
          <Group>
            {isLoggedIn && user ? (
              <Group gap="sm">
                <Text size="sm" c="dimmed" visibleFrom="sm">
                  안녕하세요, {user.username || user.name}님!
                </Text>
                <Button 
                  variant="subtle" 
                  color="gray"
                  size="sm"
                  component={Link}
                  to="/profile"
                  visibleFrom="md"
                >
                  <IconUserCircle stroke={1} width={32} height={32} />
                </Button>
                <Button 
                  variant="gradient"
                  gradient={{ from: 'green.5', to: 'green.6' }}
                  size="sm"
                  onClick={handleLogout}
                  visibleFrom="md"
                >
                  로그아웃
                </Button>
              </Group>
            ) : (
              <Button 
                variant="gradient"
                gradient={{ from: 'green.5', to: 'green.6' }}
                size="sm"
                component={Link}
                to="/login"
                visibleFrom="md"
              >
                로그인
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              size="sm"
            />
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group>
            <IconSeedling size={24} color="var(--mantine-color-green-6)" />
            <Text size="lg" fw={700} c="green.6">식집사</Text>
          </Group>
        }
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <Stack gap="md">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'light' : 'subtle'}
              color="green"
              fullWidth
              justify="flex-start"
              onClick={() => handleNavClick(item.path)}
            >
              {item.label}
            </Button>
          ))}
          
          {isLoggedIn && user ? (
            <>
              <Button
                variant="subtle"
                color="gray"
                fullWidth
                justify="flex-start"
                onClick={() => handleNavClick('/profile')}
              >
                <IconUserCircle stroke={1} width={32} height={32} />
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'green.5', to: 'green.6' }}
                fullWidth
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              variant="gradient"
              gradient={{ from: 'green.5', to: 'green.6' }}
              fullWidth
              onClick={() => handleNavClick('/login')}
            >
              로그인
            </Button>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}

export default Header;