import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Home from './pages/Home/Home';
import PropertyDetails from './pages/PropertyDetails/PropertyDetails';
import Planning from './pages/Planning/Planning';
import Flights from './pages/Flights/Flights';
import { AuthProvider } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header/Header';
import './styles/swal.css';
import './styles/flights.css';

// Layout component
const Layout = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Header />
        <Outlet />
      </AuthProvider>
    </HelmetProvider>
  );
};

// Create individual routes without nesting first
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { 
        index: true, 
        element: <Home /> 
      },
      { 
        path: "property/:id", 
        element: <PropertyDetails /> 
      },
      { 
        path: "planning", 
        element: <Planning /> 
      },
      // Add a custom error boundary for the flights route
      { 
        path: "flights", 
        element: <Flights />,
        errorElement: <div className="p-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Error Loading Flights</h1>
          <p>There was an error loading the flights page. Please try again.</p>
        </div>
      }
    ],
    // Add a custom error boundary for the layout
    errorElement: <div className="p-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Home
      </a>
    </div>
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
); 