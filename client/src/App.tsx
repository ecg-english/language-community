import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CommunityProvider } from './contexts/CommunityContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoriteChannelProvider } from './contexts/FavoriteChannelContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CommunityPage from './pages/CommunityPage';
import ChannelPage from './pages/ChannelPage';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';
import MembersPage from './pages/MembersPage';
import FeaturesPage from './pages/FeaturesPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import MonthlyHistoryPage from './pages/MonthlyHistoryPage';
import VocabularyPage from './pages/VocabularyPage';
import Class1ManagementPage from './pages/Class1ManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CommunityProvider>
            <FavoriteChannelProvider>
              <Router>
              <Layout>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/community" element={
                    <ProtectedRoute>
                      <CommunityPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/channel/:channelId" element={
                    <ProtectedRoute>
                      <ChannelPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminPanel />
                    </AdminRoute>
                  } />
                  <Route path="/profile/:userId" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/members" element={
                    <ProtectedRoute>
                      <MembersPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/features" element={
                    <ProtectedRoute>
                      <FeaturesPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/events" element={
                    <ProtectedRoute>
                      <EventsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/event/:eventId" element={
                    <ProtectedRoute>
                      <EventDetailPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/monthly-history" element={
                    <ProtectedRoute>
                      <MonthlyHistoryPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/vocabulary" element={
                    <ProtectedRoute>
                      <VocabularyPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/class1-management" element={
                    <ProtectedRoute>
                      <Class1ManagementPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/" element={<Navigate to="/community" replace />} />
                </Routes>
              </Layout>
            </Router>
            </FavoriteChannelProvider>
          </CommunityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App; 