import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Add these styles to your component
const mapStyles = {
  height: '400px',
  width: '100%',
  borderRadius: '0.5rem',
  zIndex: 1
};

// Initialize Leaflet icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ center, markerPosition, onMarkerDrag }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, 15);
    }
  }, [center, map]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker 
        position={markerPosition} 
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            onMarkerDrag(position);
          },
        }}
      />
    </>
  );
};

const LocationForm = ({ onChange, data = {} }) => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapCenter, setMapCenter] = useState([
    data.coordinates?.lat || 0,
    data.coordinates?.lng || 0
  ]);
  const [markerPosition, setMarkerPosition] = useState([
    data.coordinates?.lat || 0,
    data.coordinates?.lng || 0
  ]);

  // Add useEffect to load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/somanchiu/Keyless-Google-Maps-API@v6.8/mapsJavaScriptAPI.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        script.onload = () => {
          console.log('Google Maps API loaded successfully');
          setIsGoogleMapsLoaded(true);
        };
        script.onerror = (error) => {
          console.error('Error loading Google Maps API:', error);
        };
        document.head.appendChild(script);
      } else {
        setIsGoogleMapsLoaded(true);
      }
    };

    loadGoogleMapsAPI();
    
    // Cleanup function to remove the script when component unmounts
    return () => {
      const script = document.querySelector('script[src*="mapsJavaScriptAPI.js"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  // Debug log for initial values
  console.log('Initial values:', data);

  // Update map when data changes
  useEffect(() => {
    if (data.coordinates?.lat && data.coordinates?.lng) {
      const newLat = parseFloat(data.coordinates.lat);
      const newLng = parseFloat(data.coordinates.lng);
      setMapCenter([newLat, newLng]);
      setMarkerPosition([newLat, newLng]);
      console.log('Updating map with coordinates:', { lat: newLat, lng: newLng });
    }
  }, [data.coordinates]);

  const formik = useFormik({
    initialValues: {
      street: data.street || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      postalCode: data.postalCode || '',
      coordinates: data.coordinates || { lat: 0, lng: 0 },
    },
    validationSchema: Yup.object({
      street: Yup.string().required('Street address is required'),
      city: Yup.string().required('City is required'),
      state: Yup.string().required('State is required'),
      country: Yup.string().required('Country is required'),
      postalCode: Yup.string().required('Postal code is required'),
      coordinates: Yup.object({
        lat: Yup.number().required(),
        lng: Yup.number().required()
      }).required('Please verify location on map'),
    }),
    onSubmit: (values) => {
      console.log('Form is valid:', values);
    },
  });

  // Update parent component on form changes
  useEffect(() => {
    const currentValues = {
      street: formik.values.street,
      city: formik.values.city,
      state: formik.values.state,
      country: formik.values.country,
      postalCode: formik.values.postalCode,
      coordinates: formik.values.coordinates
    };
    onChange(currentValues);
  }, [formik.values]);

  const handleVerifyAddress = async () => {
    try {
      if (!isGoogleMapsLoaded) {
        console.log('Waiting for Google Maps API to load...');
        formik.setFieldError('street', 'Map service is loading. Please try again in a moment.');
        return;
      }

      const { street, city, state, country, postalCode } = formik.values;
      
      if (!street || !city || !country) {
        formik.setFieldError('street', 'Please fill in at least street, city, and country');
        return;
      }
      
      // Format address for Google Geocoding
      const searchQuery = [
        street.trim(),
        city.trim(),
        state.trim(),
        postalCode ? postalCode.trim() : '',
        country.trim()
      ].filter(Boolean).join(', ');
      
      console.log('Searching for address:', searchQuery);
      
      const geocoder = new window.google.maps.Geocoder();
      console.log('Geocoder created:', geocoder);
      
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          console.log('Geocoding results:', { results, status });
          if (status === 'OK' && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed with status: ${status}`));
          }
        });
      });

      const location = results[0].geometry.location;
      const newLat = parseFloat(location.lat().toFixed(9));
      const newLng = parseFloat(location.lng().toFixed(9));
      console.log('Setting new coordinates:', { lat: newLat, lng: newLng });
      
      const newCoords = [newLat, newLng];
      setMapCenter(newCoords);
      setMarkerPosition(newCoords);
      
      formik.setFieldValue('coordinates', { lat: newLat, lng: newLng });
      onChange({
        ...formik.values,
        coordinates: { lat: newLat, lng: newLng }
      });

    } catch (error) {
      console.error('Error verifying address:', error);
      formik.setFieldError('street', 'Could not find this address. Please verify it and try again.');
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Property Location</h2>
        <p className="text-sm text-gray-600">
          Enter your property's address and verify its location on the map
        </p>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="street"
                {...formik.getFieldProps('street')}
                className="pl-10 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {formik.touched.street && formik.errors.street && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.street}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                {...formik.getFieldProps('city')}
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
              {formik.touched.city && formik.errors.city && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.city}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                {...formik.getFieldProps('state')}
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
              {formik.touched.state && formik.errors.state && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.state}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                id="country"
                {...formik.getFieldProps('country')}
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
              {formik.touched.country && formik.errors.country && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.country}</p>
              )}
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                {...formik.getFieldProps('postalCode')}
                className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              />
              {formik.touched.postalCode && formik.errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.postalCode}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleVerifyAddress}
              disabled={!isGoogleMapsLoaded}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isGoogleMapsLoaded 
                  ? 'bg-primary-600 hover:bg-primary-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isGoogleMapsLoaded ? 'Verify on Map' : 'Loading Map Service...'}
            </button>
          </div>

          <div className="h-96 relative" style={mapStyles}>
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <MapComponent 
                center={mapCenter}
                markerPosition={markerPosition}
                onMarkerDrag={(position) => {
                  console.log('Marker dragged to:', position);
                  setMarkerPosition([position.lat, position.lng]);
                  formik.setFieldValue('coordinates', { lat: position.lat, lng: position.lng });
                  onChange({
                    ...formik.values,
                    coordinates: { lat: position.lat, lng: position.lng }
                  });
                }}
              />
            </MapContainer>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        {/* <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Next
        </button> */}
      </div>
    </form>
  );
};

export default LocationForm;
