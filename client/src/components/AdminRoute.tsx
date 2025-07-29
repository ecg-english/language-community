import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAuth();

  return user?.role === 'サーバー管理者' ? <>{children}</> : <Navigate to="/community" />;
};

export default AdminRoute; 