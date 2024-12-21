import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import propertyService from '../../services/propertyService';
import BasicInfoForm from './steps/BasicInfoForm';
import LocationForm from './steps/LocationForm';
import AmenitiesForm from './steps/AmenitiesForm';
import RoomForm from '../../components/Room/RoomForm';
import PhotosForm from './steps/PhotosForm';
import RulesForm from './steps/RulesForm';
import { CheckCircleIcon } from '@heroicons/react/20/solid';

const steps = [
  { id: 'basic-info', title: 'Basic Information', component: BasicInfoForm },
  { id: 'location', title: 'Location', component: LocationForm },
  { id: 'amenities', title: 'Amenities', component: AmenitiesForm },
  { id: 'rooms', title: 'Rooms', component: RoomForm },
  { id: 'photos', title: 'Photos', component: PhotosForm },
  { id: 'rules', title: 'Rules & Policies', component: RulesForm }
];

const ListProperty = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const [formData, setFormData] = useState({
    basicInfo: {
      name: '',
      description: '',
      propertyType: '',
      guests: '0',
      bedrooms: '',
      beds: '',
      bathrooms: ''
    },
    location: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      coordinates: null
    },
    amenities: {
      general: [],
      room: [],
      bathroom: [],
      kitchen: [],
      outdoor: [],
      accessibility: []
    },
    rooms: [],
    photos: [],
    rules: {
      checkInTime: null,
      checkOutTime: null,
      cancellationPolicy: '',
      houseRules: []
    }
  });

  const handleNext = () => {
    const newCompleted = { ...completed };
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const handleStepChange = (data) => {
    console.log('Step data received:', data);
    
    // Get the current step ID
    const currentStepId = steps[activeStep].id;
    
    setFormData(prev => {
      let newData;
      
      // Handle location data specially
      if (currentStepId === 'location') {
        newData = {
          ...prev,
          location: {
            ...prev.location,
            ...data
          }
        };
      } else {
        // For other forms
        newData = {
          ...prev,
          [currentStepId]: {
            ...prev[currentStepId],
            ...data
          }
        };
      }
      
      console.log('Updated form data:', newData);
      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/list-property' } });
        return;
      }

      console.log('Raw form data:', formData);
      
      if (!formData.location?.coordinates) {
        throw new Error('Location coordinates are missing');
      }

      // Format basic info
      const basicInfo = {
        name: formData.basicInfo?.name || '',
        description: formData.basicInfo?.description || '',
        propertyType: formData.basicInfo?.propertyType || 'apartment', // Use lowercase value, default to apartment
        bedrooms: parseInt(formData.basicInfo?.bedrooms) || 0,
        beds: parseInt(formData.basicInfo?.beds) || 0,
        bathrooms: parseFloat(formData.basicInfo?.bathrooms) || 0
      };

      // Calculate total guests from rooms
      const rooms = formData.rooms || [];
      const totalGuests = rooms.reduce((sum, room) => {
        return sum + (parseInt(room.maxGuests) || 0);
      }, 0);

      // Format location data
      const location = {
        street: formData.location?.street || '',
        city: formData.location?.city || '',
        state: formData.location?.state || '',
        country: formData.location?.country || '',
        postalCode: formData.location?.postalCode || '',
        coordinates: formData.location?.coordinates || null
      };

      // Format amenities
      const amenities = {
        general: formData.amenities?.general || [],
        room: formData.amenities?.room || [],
        bathroom: formData.amenities?.bathroom || [],
        kitchen: formData.amenities?.kitchen || [],
        outdoor: formData.amenities?.outdoor || [],
        accessibility: formData.amenities?.accessibility || []
      };

      // Format rules
      const formatTimeToISO = (timeStr) => {
        console.log('formatTimeToISO input:', timeStr);
        
        // Default to 2 PM for check-in, 11 AM for check-out
        const defaultTime = new Date();
        defaultTime.setHours(14, 0, 0, 0); // 2 PM
        
        if (!timeStr || timeStr === 'Invalid' || typeof timeStr !== 'string') {
          console.log('Invalid input, using default:', defaultTime.toISOString());
          return defaultTime.toISOString();
        }
        
        try {
          // Parse the time string (HH:mm)
          const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
          
          if (isNaN(hours) || isNaN(minutes) || 
              hours < 0 || hours > 23 || 
              minutes < 0 || minutes > 59) {
            console.log('Invalid time parts, using default:', defaultTime.toISOString());
            return defaultTime.toISOString();
          }
          
          // Create a new date object for today
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          
          console.log('Formatted time:', date.toISOString());
          return date.toISOString();
        } catch (err) {
          console.error('Error formatting time:', err);
          return defaultTime.toISOString();
        }
      };

      const rules = {
        houseRules: Array.isArray(formData.rules?.houseRules) ? formData.rules.houseRules : [],
        cancellationPolicy: formData.rules?.cancellationPolicy || 'flexible',
        checkInTime: formatTimeToISO(formData.rules?.checkInTime),
        checkOutTime: formatTimeToISO(formData.rules?.checkOutTime)
      };
      
      console.log('Final rules object:', rules);

      // Build the final property data
      const propertyData = {
        basicInfo: {
          ...basicInfo,
          guests: totalGuests.toString()
        },
        location,
        amenities,
        rooms,
        photos: formData.photos || [],
        rules,
        userId: user.id
      };

      console.log('Final property data:', propertyData);
      const response = await propertyService.create(propertyData);
      
      console.log('Server response:', response);
      
      if (response.data?.data?.id) {
        console.log('Property created successfully:', response.data);
        navigate(`/admin/properties`);
      } else {
        throw new Error('Failed to create property - no ID returned');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Error creating property. ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const CurrentStepComponent = steps[activeStep].component;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Property</h1>
      
      <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-4">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          const isClickable = isCompleted || index === activeStep;
          
          return (
            <button
              key={step.id}
              onClick={() => isClickable && handleStepClick(index)}
              disabled={!isClickable}
              className={`
                px-6 py-3 rounded-lg whitespace-nowrap transition-all
                ${isActive ? 'bg-primary-600 text-white shadow-md' : 
                  isCompleted ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 
                  'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
            >
              {step.title}
            </button>
          );
        })}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <CurrentStepComponent
          data={formData[steps[activeStep].id]}
          onChange={handleStepChange}
        />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={activeStep === 0}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Back
        </button>
        
        {activeStep === steps.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create Property
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ListProperty;
