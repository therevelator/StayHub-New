import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProperties from './pages/AdminProperties/AdminProperties';
import AdminEditProperty from './pages/AdminEditProperty/AdminEditProperty';
import ListProperty from './pages/ListProperty/ListProperty';
import PropertyDetails from './pages/PropertyDetails/PropertyDetails';
import SearchResults from './pages/SearchResults/SearchResults';
import EditRooms from './pages/EditRooms/EditRooms';
import RoomPage from './pages/RoomPage/RoomPage';
import AdminRoute from './components/AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'list-property', element: <ListProperty /> },
          { path: 'property/:id', element: <PropertyDetails /> },
          { path: 'property/:propertyId/room/:roomId', element: <RoomPage /> },
          { path: 'search', element: <SearchResults /> },
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
          { path: 'properties', element: <AdminProperties /> },
          { path: 'properties/:id/edit', element: <AdminEditProperty /> },
          { path: 'rooms/:id/edit', element: <EditRooms /> },
        ],
      },
    ],
  },
]);