import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import './theme/global.css';

import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Encyclopedia from './pages/Encyclopedia.jsx';
import Diagnosis from './pages/Diagnosis.jsx';
import Community from './pages/Community.jsx';
import CommunityWrite from './pages/CommunityWrite.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Diary from './pages/Diary.jsx';
import DiaryWrite from './pages/DiaryWrite.jsx';
import DiaryEdit from './pages/DiaryEdit.jsx';
import DiaryDetail from './pages/DiaryDetail.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Announcements from './pages/Announcements.jsx';
import AnnouncementDetail from './pages/AnnouncementDetail.jsx';
import Terms from './pages/Terms.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications />
        <AuthProvider>
          <Router>
            <div style={{ 
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg)'
            }}>
              <Header />
              <main style={{ flex: 1, paddingTop: '80px', display: flex}}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/encyclopedia" element={<Encyclopedia />} />
                  <Route path="/diagnosis" element={<Diagnosis />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/write" element={<CommunityWrite />} />
                  <Route path="/community/post/:id" element={<PostDetail />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/announcements/:id" element={<AnnouncementDetail />} />
                  <Route path="/diary" element={<Diary />} />
                  <Route path="/diary/write" element={<DiaryWrite />} />
                  <Route path="/diary/write/:diaryId" element={<DiaryWrite />} />
                  <Route path="/diary/edit/:diaryId/:entryId" element={<DiaryEdit />} />
                  <Route path="/diary/:diaryId/:entryId" element={<DiaryDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/auth/callback/:provider" element={<AuthCallback />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;