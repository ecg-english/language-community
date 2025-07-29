import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CommunityProvider } from './contexts/CommunityContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CommunityPage from './pages/CommunityPage';
import ChannelPage from './pages/ChannelPage';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';
import MembersPage from './pages/MembersPage';
import FeaturesPage from './pages/FeaturesPage';
import EventsPage from './pages/EventsPage';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <CommunityProvider>
        <Router basename={process.env.PUBLIC_URL}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CommunityPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/channel/:channelId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChannelPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MembersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/features"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FeaturesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EventsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/community" />} />
          </Routes>
        </Router>
      </CommunityProvider>
    </AuthProvider>
  );
}

export default App; 