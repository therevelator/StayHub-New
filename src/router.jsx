import { createBrowserRouter } from 'react-router-dom';
import RoomPage from './pages/property/[propertyId]/room/[roomId]/page';

const router = createBrowserRouter([
  // ... other routes
  {
    path: '/property/:propertyId/room/:roomId',
    element: <RoomPage />
  },
  // ... other routes
]);

export default router; 