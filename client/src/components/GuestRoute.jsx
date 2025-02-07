import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Allow both guests and regular users to access these routes
  // but not admins (they have their own section)
  if (user?.isAdmin) {
    return <Navigate to="/admin/properties" />;
  }

  return children;
};

export default GuestRoute;
