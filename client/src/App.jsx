import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import './styles/swal.css';
import './styles/flights.css';
import Header from './components/Header/Header';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Header />
        <Outlet />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
