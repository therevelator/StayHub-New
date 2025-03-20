import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-primary-600 font-bold text-xl hover:text-primary-700">
            StayHub
          </Link>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Menu icon */}
            </button>
            
            <nav className="hidden md:flex items-center space-x-4">
              {/* Navigation links */}
            </nav>
          </div>
        </div>
        
        <div className="hidden md:hidden border-t border-gray-200 py-2">
          <nav className="px-2 space-y-1">
            {/* Mobile navigation links */}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header; 