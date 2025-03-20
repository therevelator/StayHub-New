import React from 'react';
import Navigation from './Navigation';
import { useHeader } from '../context/HeaderContext';

function Header() {
  const { headerRendered, setHeaderRendered } = useHeader();
  
  // Only render the header if it hasn't been rendered yet
  if (headerRendered) {
    return null;
  }
  
  // Mark the header as rendered
  setHeaderRendered(true);
  
  return (
    <header className="bg-white shadow-sm header-component-unique">
      <Navigation />
    </header>
  );
}

export default Header; 