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
    { path: '/encyclopedia', label: '백과사전', icon: <IconBook size={20} /> },
    { path: '/diagnosis', label: 'AI 진단', icon: <IconRobot size={20} /> },
    { path: '/community', label: '커뮤니티', icon: <IconMessages size={20} /> },
    { path: '/announcements', label: '공지사항', icon: <IconSpeakerphone size={20} /> },
    { path: '/diary', label: '성장일기', icon: <IconNotebook size={20} /> }
  ];

  return (
    <Box 
      component="header"
      h={80}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(15, 23, 36, 0.08)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <Container 
        size="xl" 
        h="100%"
        px={{ base: "1rem", sm: "1.5rem", md: "2rem" }}
        w="100%"
        maw="100%"
      >
        <Group justify="space-between" h="100%">
          {/* Logo Section */}
          <Group>
            <Anchor 
              component={Link} 
              to="/" 
              style={{ textDecoration: 'none' }}
            >
              <Group gap="sm">
                <IconSeedling stroke={2} size={28} color="var(--primary-600)" />
                <Text 
                  size="xl" 
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    color: 'var(--primary-600)',
                    fontSize: '24px'
                  }}
                >
                  식집사
                </Text>
              </Group>
            </Anchor>
          </Group>

          {/* Desktop Navigation */}
          <Group visibleFrom="md" gap="sm">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'light' : 'subtle'}
                color="primary"
                size="sm"
                component={Link}
                to={item.path}
                leftSection={item.icon}
                style={{
                  fontWeight: 500,
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  padding: '0 var(--space-md)'
                }}
              >
                {item.label}
              </Button>
            ))}
          </Group>

          {/* User Section */}
          <Group>
            {isLoggedIn && user ? (
              <Group gap="sm">
                <Text 
                  size="sm" 
                  visibleFrom="sm"
                  style={{ 
                    color: 'var(--muted)',
                    fontWeight: 500 
                  }}
                >
                  안녕하세요, {user.username || user.name}님!
                </Text>
                <Button 
                  variant="subtle" 
                  color="primary"
                  size="sm"
                  component={Link}
                  to="/profile"
                  visibleFrom="md"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-xs)'
                  }}
                >
                  <IconUserCircle stroke={1.5} size={20} />
                </Button>
                <Button 
                  style={{
                    background: 'var(--primary-gradient)',
                    border: 'none',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 500
                  }}
                  size="sm"
                  onClick={handleLogout}
                  visibleFrom="md"
                >
                  로그아웃
                </Button>
              </Group>
            ) : (
              <Button 
                style={{
                  background: 'var(--primary-gradient)',
                  border: 'none',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 500
                }}
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
              color="var(--primary-600)"
            />
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="100%"
        withCloseButton={true}
        title={
          <Group>
            <IconSeedling size={24} color="var(--primary-600)" />
            <Text 
              size="lg" 
              style={{
                fontWeight: 700,
                color: 'var(--primary-600)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              식집사
            </Text>
          </Group>
        }
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        styles={{
          content: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          },
          body: {
            padding: '1rem',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <Stack gap="lg" h="100%" justify="flex-start" p="md">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'light' : 'subtle'}
              color="primary"
              fullWidth
              justify="flex-start"
              leftSection={item.icon}
              onClick={() => handleNavClick(item.path)}
              style={{
                borderRadius: 'var(--radius-md)',
                height: '56px',
                fontWeight: 500,
                fontSize: '16px'
              }}
            >
              {item.label}
            </Button>
          ))}
          
          {isLoggedIn && user ? (
            <>
              <Button
                variant="subtle"
                color="primary"
                fullWidth
                justify="flex-start"
                leftSection={<IconUserCircle stroke={1.5} size={20} />}
                onClick={() => handleNavClick('/profile')}
                style={{
                  borderRadius: 'var(--radius-md)',
                  height: '56px',
                  fontWeight: 500,
                  fontSize: '16px'
                }}
              >
                프로필
              </Button>
              <Button
                style={{
                  background: 'var(--primary-gradient)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  height: '56px',
                  fontWeight: 500,
                  fontSize: '16px'
                }}
                fullWidth
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              style={{
                background: 'var(--primary-gradient)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                height: '56px',
                fontWeight: 500,
                fontSize: '16px'
              }}
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