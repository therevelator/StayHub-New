import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import propertyService from '../../../services/propertyService';
import BasicInfoEdit from './components/BasicInfoEdit';
import LocationEdit from './components/LocationEdit';
import PoliciesEdit from './components/PoliciesEdit';
import RoomsList from './components/RoomsList';
import PhotosEdit from './components/PhotosEdit';
import StatusEdit from './components/StatusEdit';
import LoadingSpinner from '../../../components/LoadingSpinner/index';
import { useAuth } from '../../../context/AuthContext';

const EditPropertyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[EditPropertyPage] Loading property with ID:', id);
      const propertyData = await propertyService.getById(id);
      console.log('[EditPropertyPage] Loaded property data:', propertyData);
      
      if (!propertyData) {
        throw new Error('Property not found');
      }
      
      // Set the property data
      setProperty(propertyData);
      console.log('[EditPropertyPage] Property state updated:', propertyData);
    } catch (error) {
      console.error('[EditPropertyPage] Error loading property:', error);
      setError(error.message || 'Failed to load property');
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (section, sectionData) => {
    console.log('[EditPropertyPage] Starting update');
    console.log('[EditPropertyPage] Current property state:', property);
    console.log('[EditPropertyPage] Received update data:', { section, sectionData });
    
    try {
      setSaving(true);
      
      // Handle special submit case
      if (section === 'submit') {
        // Here you can add any special handling for submission
        // For now, just show a success message
        toast.success('Property setup completed successfully');
        return;
      }
      
      // Send update to server
      console.log('[EditPropertyPage] Sending update with data:', sectionData);
      const updatedProperty = await propertyService.update(id, sectionData);
      console.log('[EditPropertyPage] Update response received:', updatedProperty);
      
      // Update local state with the response data
      setProperty(updatedProperty);
      
      // Confirm update with toast
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('[EditPropertyPage] Error in handleUpdate:', error);
      console.error('[EditPropertyPage] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
      console.log('[EditPropertyPage] Update process completed');
    }
  };

  const handleRoomSubmit = async (roomData) => {
    try {
      setSaving(true);
      console.log('[Client] Starting room update with data:', roomData);
      
      let response;
      if (roomData.id) {
        response = await propertyService.updateRoom(id, roomData.id, roomData);
        console.log('[Client] Update response:', response);
      } else {
        response = await propertyService.createRoom(id, roomData);
        console.log('[Client] Create response:', response);
      }
      
      // Don't check for response.data since we changed the API response format
      if (!response) {
        throw new Error(`Failed to ${roomData.id ? 'update' : 'create'} room`);
      }

      // Reload the entire property data
      await loadProperty();
      
      toast.success(`Room ${roomData.id ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('[Client] Error saving room:', error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${roomData.id ? 'update' : 'create'} room`;
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRoomDelete = async (roomId) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Room',
        text: 'Are you sure you want to delete this room?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) {
        return;
      }

      setSaving(true);
      await propertyService.deleteRoom(id, roomId);
      await loadProperty(); // Refresh property data
      
      await Swal.fire({
        title: 'Deleted!',
        text: 'Room has been deleted successfully.',
        icon: 'success'
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete room';
      
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/properties');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Error Loading Property</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={() => navigate('/admin/properties')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Back to Properties
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Property not found</h2>
        <p className="mt-2 text-gray-600">The property you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/admin/properties')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Back to Properties
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
        <button
          onClick={handleCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </button>
      </div>

      <Tab.Group manual>
        {/* manual prop prevents auto-switching */}
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-900/20 p-1">
          {['Basic Info', 'Location', 'Policies', 'Rooms', 'Photos', 'Status'].map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                 ${selected
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-700 hover:bg-white/[0.12] hover:text-primary-600'
                }`
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-8">
          <Tab.Panel>
            <BasicInfoEdit
              property={property}
              onUpdate={handleUpdate}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <LocationEdit
              property={property}
              onUpdate={handleUpdate}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <PoliciesEdit
              property={property}
              onUpdate={handleUpdate}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <RoomsList
              propertyId={id}
              rooms={property.rooms}
              onRoomSubmit={handleRoomSubmit}
              onRoomDelete={handleRoomDelete}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <PhotosEdit
              propertyId={id}
              photos={property.photos}
              onUpdate={loadProperty}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <StatusEdit
              property={property}
              onUpdate={(data) => handleUpdate('Status', data)}
              disabled={saving}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default EditPropertyPage; 