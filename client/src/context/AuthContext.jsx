import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return authService.getCurrentUser();
  });

  const login = (userData, token) => {
    if (!userData || !token) {
      console.error('Login failed: Missing user data or token');
      throw new Error('Invalid login data');
    }

    const userWithAdmin = {
      ...userData,
      isAdmin: userData.role === 'admin'
    };
    
    localStorage.setItem('user', JSON.stringify(userWithAdmin));
    localStorage.setItem('token', token);
    setUser(userWithAdmin);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Check token expiration periodically
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        logout();
      }
    };

    const interval = setInterval(checkAuth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
