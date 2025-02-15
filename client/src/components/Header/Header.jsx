import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  BuildingOfficeIcon, 
  UserCircleIcon, 
  ShieldCheckIcon,
  CalendarDaysIcon,
  HomeIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  HeartIcon
} from '@heroicons/react/20/solid';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
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

          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <HomeIcon className="h-5 w-5 mr-2" />
                    Home
                  </Link>

                  {/* Navigation based on user type */}
                  {user?.isAdmin ? (
                    // Admin Navigation
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        to="/admin/properties"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                        Properties
                      </Link>
                      <Link
                        to="/admin/users"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <UserCircleIcon className="h-5 w-5 mr-2" />
                        Users
                      </Link>
                    </>
                  ) : (user?.role === 'host' || user?.role === 'owner') ? (
                    // Property Owner Navigation
                    <>
                      <Link
                        to="/properties/add"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                        List Property
                      </Link>
                      <Link
                        to="/properties"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <BuildingStorefrontIcon className="h-5 w-5 mr-2" />
                        My Properties
                      </Link>
                      <Link
                        to="/bookings"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <CalendarDaysIcon className="h-5 w-5 mr-2" />
                        Bookings
                      </Link>
                    </>
                  ) : (
                    // Guest Navigation
                    <>
                      <Link
                        to="/myreservations"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <CalendarDaysIcon className="h-5 w-5 mr-2" />
                        My Reservations
                      </Link>
                      <Link
                        to="/favorites"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                      >
                        <HeartIcon className="h-5 w-5 mr-2" />
                        Favorites
                      </Link>
                    </>
                  )}

                  <Link
                    to="/account"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <Cog6ToothIcon className="h-5 w-5 mr-2" />
                    Account
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <UserCircleIcon className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
