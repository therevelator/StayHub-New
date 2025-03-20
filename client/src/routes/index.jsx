import { Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/Admin/Dashboard';
import AdminProperties from '../pages/Admin/Properties';
import AddProperty from '../pages/Admin/AddProperty';
import EditPropertyPage from '../pages/Admin/EditProperty/EditPropertyPage';
import AdminBookings from '../pages/Admin/Bookings';
import AdminUsers from '../pages/Admin/Users';
import AdminSettings from '../pages/Admin/Settings';
import Flights from '../pages/Flights';

const routes = [
  // Admin routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'properties', element: <AdminProperties /> },
      { path: 'properties/add', element: <AddProperty /> },
      { path: 'properties/:id/edit', element: <EditPropertyPage /> },
      { path: 'bookings', element: <AdminBookings /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'flights', element: <Flights /> }
    ]
  }
];

export default routes; 