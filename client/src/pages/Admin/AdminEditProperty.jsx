import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useParams } from 'react-router-dom';

const AdminEditProperty = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    basicInfo: {
      name: '',
      description: '',
      propertyType: '',
      guests: 1,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1
    },
    location: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      coordinates: { lat: null, lng: null }
    },
    rules: {
      checkInTime: null,
      checkOutTime: null,
      cancellationPolicy: '',
      petPolicy: '',
      eventPolicy: '',
      isActive: true
    }
  });

  // When loading property data
  useEffect(() => {
    const loadProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        const property = response.data.data;
        
        setFormData({
          // ... other form data
          rules: {
            checkInTime: property.check_in_time,
            checkOutTime: property.check_out_time,
            cancellationPolicy: property.cancellation_policy,
            petPolicy: property.pet_policy,
            eventPolicy: property.event_policy,
            isActive: property.is_active === 1
          },
          // ... rest of the form data
        });
      } catch (error) {
        console.error('Error loading property:', error);
      }
    };

    loadProperty();
  }, [id]);

  return (
    // ... rest of the component
  );
}
export default AdminEditProperty; 

