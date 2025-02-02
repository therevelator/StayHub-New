import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  BuildingOfficeIcon, 
  UserCircleIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/20/solid';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-primary-600 font-bold text-xl hover:text-primary-700">
            StayHub
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <Link
                to="/admin/properties/add"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                List Property
              </Link>
            )}
            {isAuthenticated && (
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Find Places
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={handleMenu}
                  className="flex items-center text-gray-700 hover:text-primary-600"
                >
                  <UserCircleIcon className="h-8 w-8" />
                </button>
                {anchorEl && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    {user?.isAdmin && (
                      <Link
                        to="/admin/properties"
                        className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={handleClose}
                      >
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden ml-4 text-gray-700 hover:text-primary-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
