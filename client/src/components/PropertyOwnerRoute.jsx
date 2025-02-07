import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PropertyOwnerRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user?.isHost && !user?.isAdmin) {
    // Redirect to home if user is not a property owner or admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PropertyOwnerRoute;
