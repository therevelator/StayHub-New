import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { propertyOwnerService } from '../../services/propertyOwnerService';
import propertyService from '../../services/propertyService';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isPropertiesPage = location.pathname === '/owner/properties';

  const fetchProperties = async () => {
    try {
      const response = await propertyOwnerService.getMyProperties();
      setProperties(response.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDeleteProperty = async (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You won\'t be able to revert this!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Deleting property...',
          text: 'This may take a moment',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        await propertyService.deleteProperty(propertyId);
        await fetchProperties();
        
        Swal.close();
        toast.success('Property deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      
      // Close loading dialog if open
      Swal.close();
      
      // Show more specific error message
      let errorMessage = 'Failed to delete property';
      let errorTitle = 'Error';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this property';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
          
          // Special handling for active bookings error
          if (error.response.data.code === 'ACTIVE_BOOKINGS' || 
              errorMessage.includes('active bookings')) {
            errorTitle = 'Cannot Delete Property';
          }
        }
      }
      
      // Use SweetAlert for more serious errors
      if (errorMessage.includes('active bookings')) {
        Swal.fire({
          title: errorTitle,
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleEditProperty = (e, propertyId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/owner/properties/${propertyId}/edit`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isPropertiesPage ? 'My Properties' : 'Owner Dashboard'}</h1>
        <Button asChild>
          <Link to="/owner/properties/add">Add New Property</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.length === 0 ? (
          <div className="col-span-3 text-center py-10 bg-gray-50 rounded-lg shadow-sm p-8">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="text-gray-600 mb-4 text-lg">You don't have any properties yet.</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/owner/properties/add" className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Your First Property
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 group">
              <Link to={`/owner/properties/${property.id}`} className="block">
                <div className="h-40 bg-gradient-to-r from-blue-500 to-indigo-600 relative overflow-hidden">
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs font-medium text-blue-700">
                    {property.property_type || 'Property'}
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {property.name}
                  </CardTitle>
                  <p className="text-gray-500 flex items-center text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {property.address}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Rooms</p>
                      <p className="text-lg font-semibold text-gray-800">{property.rooms_count || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Bookings</p>
                      <p className="text-lg font-semibold text-gray-800">{property.active_bookings_count || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="text-lg font-semibold text-gray-800 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {property.star_rating || '4.5'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Link>
              
              <CardFooter className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    <span className="w-2 h-2 mr-1 bg-teal-500 rounded-full animate-pulse"></span>
                    Active
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => handleEditProperty(e, property.id)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={(e) => handleDeleteProperty(e, property.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;