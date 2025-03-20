import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import './styles/swal.css';
import './styles/flights.css';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>

        <Outlet />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
