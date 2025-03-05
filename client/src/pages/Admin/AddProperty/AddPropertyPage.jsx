import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import propertyService from '../../../services/propertyService';
import { Tab } from '@headlessui/react';
import BasicInfoEdit from '../EditProperty/components/BasicInfoEdit';
import LocationEdit from '../EditProperty/components/LocationEdit';
import PoliciesEdit from '../EditProperty/components/PoliciesEdit';
import RoomsList from '../EditProperty/components/RoomsList';
import PhotosEdit from '../EditProperty/components/PhotosEdit';
import StatusEdit from '../EditProperty/components/StatusEdit';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const TABS = ['Basic Info', 'Location', 'Policies', 'Rooms', 'Photos', 'Status'];

const AddPropertyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [property, setProperty] = useState({
    // Required fields
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    city: '',
    country: '',
    host_id: user?.id || null,
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    property_type: 'hotel',

    // Optional fields
    street: '',
    state: '',
    postal_code: '',
    star_rating: 0,
    languages_spoken: [],
    check_in_time: '14:00:00',
    check_out_time: '11:00:00',
    cancellation_policy: 'flexible',
    pet_policy: '',
    event_policy: '',
    min_stay: 1,
    max_stay: 30,
    house_rules: '',

    // Frontend-only fields (not in DB)
    rooms: [],
    photos: []
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to create a property');
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.id) {
      setProperty(prev => ({
        ...prev,
        host_id: user.id
      }));
    }
  }, [user]);

  const handleUpdate = async (section, data) => {
    console.log(`[AddPropertyPage] Updating ${section} with data:`, data);
    setSaving(true);
    try {
      if (section === 'submit') {
        await handleSubmit();
        return;
      }

      // Validate data based on section
      switch (section) {
        case 'basic':
          if (!data.name?.trim()) throw new Error('Property name is required');
          if (!data.description?.trim()) throw new Error('Description is required');
          break;
        case 'location':
          if (!data.city?.trim()) throw new Error('City is required');
          if (!data.country?.trim()) throw new Error('Country is required');
          break;
        case 'policies':
          // Validate check-in/check-out times
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
          if (!timeRegex.test(data.check_in_time)) throw new Error('Invalid check-in time format');
          if (!timeRegex.test(data.check_out_time)) throw new Error('Invalid check-out time format');
          
          // Validate min/max stay
          if (data.min_stay < 1) throw new Error('Minimum stay must be at least 1 night');
          if (data.max_stay < data.min_stay) throw new Error('Maximum stay must be greater than minimum stay');
          break;
        case 'status':
          setProperty(prev => ({
            ...prev,
            is_active: data.is_active ?? true
          }));
          break;
        case 'languages':
          setProperty(prev => ({
            ...prev,
            languages_spoken: data.languages_spoken || []
          }));
          break;
        // Add other section validations as needed
      }

      if (section !== 'status' && section !== 'languages') {
        setProperty(prev => ({
          ...prev,
          ...data
        }));
      }
      
      toast.success(`${section} updated successfully`);
      
      // Advance to next tab if not on the last tab
      if (selectedIndex < TABS.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      toast.error(error.message || `Failed to update ${section}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    console.log('[AddPropertyPage] Starting form submission...'); 

    try {
      if (!user?.id) {
        console.log('No user ID found');
        toast.error('You must be logged in to create a property');
        navigate('/login');
        return;
      }

      setSaving(true);
      console.log('[AddPropertyPage] Submitting property data:', property);

      // Extract photos from property data
      // Format data for API
      const { photos, rooms, ...propertyData } = property;
      
      // Ensure all required fields are present and properly formatted
      const formattedData = {
        ...propertyData,
        host_id: user.id,
        // Required fields validation
        name: propertyData.name?.trim(),
        description: propertyData.description?.trim(),
        city: propertyData.city?.trim(),
        country: propertyData.country?.trim(),
        latitude: parseFloat(propertyData.latitude) || 0,
        longitude: parseFloat(propertyData.longitude) || 0,
        guests: parseInt(propertyData.guests) || 1,
        bedrooms: parseInt(propertyData.bedrooms) || 1,
        beds: parseInt(propertyData.beds) || 1,
        bathrooms: parseInt(propertyData.bathrooms) || 1,
        property_type: propertyData.property_type,

        // Optional fields
        street: propertyData.street?.trim(),
        state: propertyData.state?.trim(),
        postal_code: propertyData.postal_code?.trim(),
        star_rating: parseFloat(propertyData.star_rating) || 0,
        languages_spoken: Array.isArray(propertyData.languages_spoken) ? propertyData.languages_spoken : [],
        check_in_time: propertyData.check_in_time || '14:00:00',
        check_out_time: propertyData.check_out_time || '11:00:00',
        cancellation_policy: propertyData.cancellation_policy?.trim() || 'flexible',
        pet_policy: propertyData.pet_policy?.trim(),
        event_policy: propertyData.event_policy?.trim(),
        min_stay: parseInt(propertyData.min_stay) || 1,
        max_stay: parseInt(propertyData.max_stay) || 30,
        house_rules: propertyData.house_rules?.trim(),
        is_active: propertyData.is_active ?? true
      };

      // Validate required fields
      const requiredFields = ['name', 'description', 'city', 'country', 'host_id'];
      const missingFields = requiredFields.filter(field => !formattedData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('[AddPropertyPage] Formatted data:', formattedData);
      const images = photos.map(photo => photo.file).filter(Boolean);
      
      const response = await propertyService.create(formattedData, images);
      console.log('[AddPropertyPage] Property created:', response);

      if (!response || !response.data) {
        throw new Error('No response received from server');
      }

      // Show success modal
      await Swal.fire({
        title: 'Property Created Successfully!',
        text: 'Your property has been created and is ready to accept bookings.',
        icon: 'success',
        confirmButtonText: 'View Properties',
        confirmButtonColor: '#10B981'
      });

      toast.success('Property created successfully!');
      
      // Navigate based on user role
      if (user.isAdmin) {
        navigate('/admin/properties');
      } else if (user.isHost) {
        navigate('/owner/properties');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('[AddPropertyPage] Error creating property:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create property';
      
      // Show error modal
      await Swal.fire({
        title: 'Error Creating Property',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#EF4444'
      });

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRoomSubmit = async (roomData) => {
    console.log('[AddPropertyPage] Processing room:', roomData);
    try {
      setProperty(prev => {
        if (roomData.id) {
          // Update existing room
          const updatedRooms = prev.rooms.map(room => 
            room.id === roomData.id ? { ...roomData } : room
          );
          console.log('[AddPropertyPage] Updated rooms:', updatedRooms);
          return { ...prev, rooms: updatedRooms };
        } else {
          // Add new room
          const newRoom = { ...roomData, id: Date.now() };
          console.log('[AddPropertyPage] Adding new room:', newRoom);
          return { ...prev, rooms: [...prev.rooms, newRoom] };
        }
      });
      
      toast.success(roomData.id ? 'Room updated successfully' : 'Room added successfully');
    } catch (error) {
      console.error('Error processing room:', error);
      toast.error(roomData.id ? 'Failed to update room' : 'Failed to add room');
      throw error;
    }
  };

  const handleRoomDelete = async (roomId) => {
    console.log('[AddPropertyPage] Deleting room:', roomId);
    try {
      setProperty(prev => ({
        ...prev,
        rooms: prev.rooms.filter(room => room.id !== roomId)
      }));
      toast.success('Room removed successfully');
    } catch (error) {
      console.error('Error removing room:', error);
      toast.error('Failed to remove room');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
      </div>

      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-900/20 p-1 mb-8">
          {TABS.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-primary-700
                ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2
                ${selected
                  ? 'bg-white shadow'
                  : 'text-primary-500 hover:bg-white/[0.12] hover:text-primary-600'
                }`
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
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
              propertyId={property.id} 
              rooms={property.rooms} 
              onRoomSubmit={handleRoomSubmit} 
              onRoomDelete={handleRoomDelete} 
              disabled={saving} 
            />
          </Tab.Panel>
          <Tab.Panel>
            <PhotosEdit 
              property={property} 
              onUpdate={handleUpdate} 
              disabled={saving} 
            />
          </Tab.Panel>
          <Tab.Panel>
            <StatusEdit 
              property={property} 
              onUpdate={handleUpdate} 
              onSubmit={handleSubmit}
              disabled={saving} 
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AddPropertyPage;
