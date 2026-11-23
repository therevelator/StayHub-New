import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProperties from './pages/Admin/Properties';
import EditPropertyPage from './pages/Admin/EditProperty/EditPropertyPage';
import AddPropertyPage from './pages/Admin/AddProperty/AddPropertyPage';
import AdminUsers from './pages/AdminUsers/AdminUsers';

import PropertyDetails from './pages/PropertyDetails/PropertyDetails';
import SearchResults from './pages/SearchResults/SearchResults';
import EditRooms from './pages/EditRooms/EditRooms';
import RoomPage from './pages/RoomPage/RoomPage';
import Trips from './pages/Trips/Trips';
import Planning from './pages/Planning/Planning';
import SearchConsole from './pages/SearchConsole/SearchConsole';
import ConsoleResults from './pages/SearchConsole/Results';
import ConsoleStay from './pages/SearchConsole/Stay';
import ConsoleCheckout from './pages/SearchConsole/Checkout';
import ConsoleConfirmed from './pages/SearchConsole/Confirmed';
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';
import PropertyOwnerRoute from './components/PropertyOwnerRoute';
import GuestRoute from './components/GuestRoute';
import Dashboard from './pages/PropertyOwner/Dashboard';
import PropertyView from './pages/PropertyOwner/PropertyView';
import MyReservations from './pages/Guest/MyReservations';

import Account from './pages/PropertyOwner/Account';
import Bookings from './pages/PropertyOwner/Bookings';

// Property Owner Routes
const propertyOwnerRoutes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <PropertyOwnerRoute>
            <Dashboard />
          </PropertyOwnerRoute>
        ),
      },
      {
        path: 'properties',
        element: (
          <PropertyOwnerRoute>
            <Dashboard />
          </PropertyOwnerRoute>
        ),
      },
      {
        path: 'properties/:propertyId',
        element: (
          <PropertyOwnerRoute>
            <PropertyView />
          </PropertyOwnerRoute>
        ),
      },
      {
        path: 'properties/add',
        element: (
          <PropertyOwnerRoute>
            <AddPropertyPage />
          </PropertyOwnerRoute>
        ),
      },
      {
        path: 'properties/:id/edit',
        element: (
          <PropertyOwnerRoute>
            <EditPropertyPage />
          </PropertyOwnerRoute>
        ),
      },
      {
        path: 'bookings',
        element: (
          <PropertyOwnerRoute>
            <Bookings />
          </PropertyOwnerRoute>
        ),
      },
      {
        path: 'account',
        element: (
          <PropertyOwnerRoute>
            <Account />
          </PropertyOwnerRoute>
        ),
      }
    ]
  }
];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Booking Console flow (design concept 1a), kept as a preview under /console.
      // Full-bleed screens with their own toolbars, so they sit outside MainLayout.
      // The existing landing page (/) and results page (/search) are untouched.
      { path: 'console', element: <SearchConsole /> },        // A1 Search
      { path: 'console/search', element: <ConsoleResults /> }, // A2 Results
      { path: 'stay/:id', element: <ConsoleStay /> },         // A3 Rooms compare
      { path: 'book/:roomId', element: <ConsoleCheckout /> }, // A4 Checkout
      { path: 'trips/:ref', element: <ConsoleConfirmed /> },  // A5 Confirmed
      {
        path: '/',
        element: <MainLayout />,
        children: [
          {
            path: '/trips',
            element: <PrivateRoute><Trips /></PrivateRoute>,
          },
          {
            path: '/planning',
            element: <Planning />,
          },
          { index: true, element: <Home /> },
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },

          { path: 'property/:propertyId', element: <PropertyDetails /> },
          { path: 'property/:propertyId/room/:roomId', element: <RoomPage /> },
          { path: 'search', element: <SearchResults /> },
          {
            path: 'myreservations',
            element: <GuestRoute><MyReservations /></GuestRoute>
          },
          {
            path: 'admin/properties',
            element: <AdminRoute><AdminProperties /></AdminRoute>
          },
          {
            path: 'admin/properties/add',
            element: <AdminRoute><AddPropertyPage /></AdminRoute>
          },
          {
            path: 'admin/properties/:id/edit',
            element: <AdminRoute><EditPropertyPage /></AdminRoute>
          },
        ],
      },
      {
        path: 'admin',
        element: (
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'rooms/:id/edit', element: <EditRooms /> },
          { path: 'users', element: <AdminUsers /> },
        ],
      },
      ...propertyOwnerRoutes,
    ],
  },
]);