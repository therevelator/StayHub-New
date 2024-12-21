import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { PlusIcon } from '@heroicons/react/20/solid';
import BasicInfoForm from '../ListProperty/steps/BasicInfoForm';
import LocationForm from '../ListProperty/steps/LocationForm';
import AmenitiesForm from '../ListProperty/steps/AmenitiesForm';
import PhotosForm from '../ListProperty/steps/PhotosForm';
import RulesForm from '../ListProperty/steps/RulesForm';
import RoomForm from '../../components/Room/RoomForm';

const steps = [
  'Basic Information',
  'Location',
  'Amenities',
  'Rooms',
  'Photos',
  'Rules & Policies'
];

const AdminEditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        if (response.data.status === 'success') {
          setFormData(response.data.data);
        } else {
          throw new Error('Failed to load property data');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Ensure we have coordinates
      if (!formData.location.coordinates) {
        throw new Error('Location coordinates are missing');
      }

      const response = await api.put(`/properties/${id}`, formData);
      
      if (response.status === 200) {
        navigate('/admin/properties');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      alert(error.message || 'Error updating property. Please try again.');
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setIsRoomDialogOpen(true);
  };

  const handleEditRoom = (room) => {
    // Parse JSON strings if necessary
    const parsedRoom = {
      ...room,
      beds: typeof room.beds === 'string' ? JSON.parse(room.beds) : room.beds,
      amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities,
      accessibility_features: typeof room.accessibility_features === 'string' 
        ? JSON.parse(room.accessibility_features) 
        : room.accessibility_features,
      energy_saving_features: typeof room.energy_saving_features === 'string'
        ? JSON.parse(room.energy_saving_features)
        : room.energy_saving_features,
      images: typeof room.images === 'string' ? JSON.parse(room.images) : room.images
    };

    console.log('Editing room with data:', parsedRoom); // Debug log
    setEditingRoom(parsedRoom);
    setIsRoomDialogOpen(true);
  };

  const handleRoomSubmit = async (roomData) => {
    try {
      console.log('Submitting room data:', roomData); // Debug log

      let response;
      if (editingRoom) {
        response = await api.put(`/rooms/${editingRoom.id}`, roomData);
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to update room');
        }
      } else {
        response = await api.post(`/rooms/${id}`, roomData);
        if (response.data.status !== 'success') {
          throw new Error(response.data.message || 'Failed to create room');
        }
      }
      
      // Close modal first for better UX
      setIsRoomDialogOpen(false);
      
      // Then refresh property data
      response = await api.get(`/properties/${id}`);
      if (response.data.status === 'success') {
        setFormData(response.data.data);
        setEditingRoom(null);
      } else {
        throw new Error('Failed to refresh property data');
      }
    } catch (err) {
      console.error('Error saving room:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save room';
      alert(errorMessage);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await api.delete(`/rooms/${roomId}`);
        // Refresh property data
        const response = await api.get(`/properties/${id}`);
        setFormData(response.data.data);
      } catch (err) {
        console.error('Error deleting room:', err);
        alert(err.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  const getStepContent = (step) => {
    if (!formData) return null;

    switch (step) {
      case 0:
        return (
          <BasicInfoForm
            data={formData.basicInfo}
            onChange={(data) => setFormData(prev => ({ ...prev, basicInfo: data }))}
          />
        );
      case 1:
        return (
          <LocationForm
            data={formData.location}
            onChange={(data) => setFormData(prev => ({ ...prev, location: data }))}
          />
        );
      case 2:
        return (
          <AmenitiesForm
            data={formData.amenities}
            onChange={(data) => setFormData(prev => ({ ...prev, amenities: data }))}
          />
        );
      case 3:
        return (
          <div className="space-y-4">
            {formData.rooms?.map((room, index) => (
              <div
                key={room.id || index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
                  <p className="text-sm text-gray-500">
                    {room.type} - Max Occupancy: {room.maxOccupancy}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditRoom(room)}
                    className="px-3 py-1 text-sm text-primary-600 hover:text-primary-700 border border-primary-600 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddRoom}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add New Room
            </button>
          </div>
        );
      case 4:
        return (
          <PhotosForm
            data={formData.photos}
            onChange={(data) => setFormData(prev => ({ ...prev, photos: data }))}
          />
        );
      case 5:
        return (
          <RulesForm
            data={formData.rules}
            onChange={(data) => setFormData(prev => ({ ...prev, rules: data }))}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Property not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Property
          </h1>
        </div>

        <div className="flex justify-between items-center mb-6">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`${
                activeStep === index ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              } py-2 px-4 rounded-lg`}
            >
              {label}
            </div>
          ))}
        </div>

        {getStepContent(activeStep)}

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleBack}
            disabled={activeStep === 0}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-600 rounded"
          >
            Back
          </button>
          <button
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            className="px-3 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 border border-primary-600 rounded"
          >
            {activeStep === steps.length - 1 ? 'Save Changes' : 'Next'}
          </button>
        </div>
      </div>

      {isRoomDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h2>
            <RoomForm
              onSubmit={handleRoomSubmit}
              initialData={editingRoom}
              onCancel={() => setIsRoomDialogOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditProperty;