import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userInfo) => {
    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('oauth_state');
    // 페이지 새로고침으로 완전히 로그아웃 상태로 초기화
    window.location.href = '/';
  };

  const isLoggedIn = !!user;

  const value = {
    user,
    login,
    logout,
    isLoggedIn,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;