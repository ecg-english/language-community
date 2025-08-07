import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CommunityProvider } from './contexts/CommunityContext';
import { LanguageProvider } from './contexts/LanguageContext';
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
import MonthlyHistoryPage from './pages/MonthlyHistoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CommunityProvider>
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
                <Route path="/monthly-history" element={
                  <ProtectedRoute>
                    <MonthlyHistoryPage />
                  </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/community" replace />} />
              </Routes>
            </Layout>
          </Router>
        </CommunityProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App; 