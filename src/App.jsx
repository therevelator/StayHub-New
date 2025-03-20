import { RouterProvider } from 'react-router-dom';
import router from './router'; // Import the router from router.jsx

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App; 