import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import propertyService from '../../services/propertyService';
import { Tab } from '@headlessui/react';
import BasicInfoEdit from '../Admin/EditProperty/components/BasicInfoEdit';
import LocationEdit from '../Admin/EditProperty/components/LocationEdit';
import PoliciesEdit from '../Admin/EditProperty/components/PoliciesEdit';
import RoomsList from '../Admin/EditProperty/components/RoomsList';
import PhotosEdit from '../Admin/EditProperty/components/PhotosEdit';
import StatusEdit from '../Admin/EditProperty/components/StatusEdit';
import { toast } from 'react-hot-toast';

const TABS = ['Basic Info', 'Location', 'Policies', 'Rooms', 'Photos', 'Status'];

const ListProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [property, setProperty] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    price: '',
    rating: 0,
    host_id: user?.id || null,
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    property_type: 'hotel',
    check_in_time: '14:00:00',
    check_out_time: '11:00:00',
    cancellation_policy: 'flexible',
    pet_policy: '',
    event_policy: '',
    star_rating: 0,
    languages_spoken: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rooms: [],
    photos: [],
    amenities: []
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
    console.log(`[ListProperty] Updating ${section} with data:`, data);
    setSaving(true);
    try {
      setProperty(prev => ({
        ...prev,
        ...data
      }));
      toast.success(`${section} updated successfully`);
      
      // Advance to next tab if not on the last tab
      if (selectedIndex < TABS.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      toast.error(`Failed to update ${section}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    console.log('Starting form submission...'); 

    try {
      if (!user?.id) {
        console.log('No user ID found');
        toast.error('You must be logged in to create a property');
        navigate('/login');
        return;
      }

      const response = await propertyService.create(property);
      
      if (response.status === 'success') {
        toast.success('Property created successfully!');
        navigate('/admin/properties');
      } else {
        toast.error('Failed to create property. Please try again.');
      }
    } catch (error) {
      console.error('Error in property creation:', error);
      toast.error(error.message || 'An error occurred while creating the property.');
    }
  };

  const handleCancel = () => {
    navigate('/admin/properties');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">List Your Property</h1>
        <div className="flex gap-4">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create Property
          </button>
        </div>
      </div>

      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-900/20 p-1">
          {TABS.map((category) => (
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
              onUpdate={(data) => handleUpdate('Basic Info', data)}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <LocationEdit
              property={property}
              onUpdate={(data) => handleUpdate('Location', data)}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <PoliciesEdit
              property={property}
              onUpdate={(data) => handleUpdate('Policies', data)}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <RoomsList
              propertyId={property.id}
              rooms={property.rooms}
              onRoomSubmit={(room) => handleUpdate('Rooms', { rooms: [...property.rooms, room] })}
              onRoomDelete={(roomId) => handleUpdate('Rooms', { rooms: property.rooms.filter(r => r.id !== roomId) })}
              disabled={saving}
            />
          </Tab.Panel>

          <Tab.Panel>
            <PhotosEdit
              propertyId={property.id}
              photos={property.photos}
              onUpdate={(data) => handleUpdate('Photos', data)}
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

export default ListProperty;
