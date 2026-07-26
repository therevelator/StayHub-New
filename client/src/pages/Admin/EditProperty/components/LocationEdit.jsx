import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapPinIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-hot-toast';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// Component to update map view when coordinates change
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

// Free, keyless geocoding via OpenStreetMap Nominatim.
// (Replaces the previous OpenCage calls, whose API key is no longer valid.)
const mapNominatim = (item) => {
  const a = item.address || {};
  return {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    components: {
      road: [a.road, a.house_number].filter(Boolean).join(' '),
      city: a.city || a.town || a.village || a.municipality || '',
      state: a.state || a.county || '',
      country: a.country || '',
      postcode: a.postcode || '',
    },
  };
};

const nominatimSearch = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapNominatim) : [];
};

const nominatimReverse = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const data = await res.json();
  return data && data.address ? mapNominatim(data) : null;
};

const LocationEdit = ({ property, onUpdate, disabled }) => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: ''
  });

  const [mapCenter, setMapCenter] = useState([44.4268, 26.1025]); // Default to Bucharest
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (property) {
      const newFormData = {
        street: property.street || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || '',
        postal_code: property.postal_code || '',
        latitude: property.latitude || '',
        longitude: property.longitude || ''
      };
      setFormData(newFormData);

      if (property.latitude && property.longitude) {
        const position = [parseFloat(property.latitude), parseFloat(property.longitude)];
        setMapCenter(position);
        setMarkerPosition(position);
      }
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate('Location', formData);
      toast.success('Location updated successfully');
      // No need to update form data since we want to keep the current values
      // and the parent component will update the property prop if needed
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.loading('Getting your current location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const result = await nominatimReverse(latitude, longitude);

          if (result) {
            const c = result.components;
            setFormData(prev => ({
              ...prev,
              street: c.road || '',
              city: c.city || '',
              state: c.state || '',
              country: c.country || '',
              postal_code: c.postcode || '',
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString()
            }));
          }
          
          setMapCenter([latitude, longitude]);
          setMarkerPosition([latitude, longitude]);
          toast.dismiss();
          toast.success('Location updated successfully');
        } catch (error) {
          console.error('Error getting address:', error);
          toast.dismiss();
          toast.error('Failed to get address details');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.dismiss();
        toast.error('Unable to retrieve your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const verifyAddress = async () => {
    if (disabled) return;

    const address = [
      formData.street,
      formData.city,
      formData.state,
      formData.country,
      formData.postal_code
    ].filter(Boolean).join(', ');

    if (!address) {
      toast.error('Please enter an address to verify');
      return;
    }

    setIsVerifying(true);
    toast.loading('Verifying address...');

    try {
      // Try progressively simpler queries. Users often type the full address
      // (incl. city/country) into the street field, so a naive concatenation of
      // every field produces a redundant query Nominatim can't match. Fall back
      // to less specific variants until one returns a hit.
      const candidates = [
        [formData.street, formData.city, formData.country].filter(Boolean).join(', '),
        [formData.street, formData.country].filter(Boolean).join(', '),
        formData.street,
        [formData.city, formData.state, formData.country].filter(Boolean).join(', '),
      ].filter((q, i, arr) => q && arr.indexOf(q) === i);

      let results = [];
      for (const q of candidates) {
        results = await nominatimSearch(q);
        if (results.length > 0) break;
      }

      if (results.length > 0) {
        // Prefer a result matching the entered city + country; else the first.
        const best =
          results.find((r) => {
            const cityMatch =
              r.components.city &&
              formData.city &&
              r.components.city.toLowerCase() === formData.city.toLowerCase();
            const countryMatch =
              r.components.country &&
              formData.country &&
              r.components.country.toLowerCase() === formData.country.toLowerCase();
            return cityMatch && countryMatch;
          }) || results[0];

        const { lat, lng, components } = best;

        setFormData((prev) => ({
          ...prev,
          street: components.road || prev.street,
          city: components.city || prev.city,
          state: components.state || prev.state,
          country: components.country || prev.country,
          postal_code: components.postcode || prev.postal_code,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        setMapCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
        toast.dismiss();
        toast.success('Address verified successfully');
      } else {
        toast.dismiss();
        toast.error('Could not verify this address');
      }
    } catch (error) {
      console.error('Error verifying address:', error);
      toast.dismiss();
      toast.error('Failed to verify address');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLocationSelect = async (latlng) => {
    if (disabled) return;
    
    const { lat, lng } = latlng;
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    setMarkerPosition([lat, lng]);

    try {
      const result = await nominatimReverse(lat, lng);

      if (result) {
        const c = result.components;
        setFormData(prev => ({
          ...prev,
          street: c.road || '',
          city: c.city || '',
          state: c.state || '',
          country: c.country || '',
          postal_code: c.postcode || '',
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
        toast.success('Location updated successfully');
      }
    } catch (error) {
      console.error('Error getting address:', error);
      toast.error('Failed to get address details');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Map */}
      <div className="h-[400px] rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {markerPosition && (
            <Marker position={markerPosition} />
          )}
          <MapEvents onLocationSelect={handleLocationSelect} />
          <MapUpdater center={mapCenter} />
        </MapContainer>
      </div>

      {/* Street Address */}
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700">
          Street Address
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            name="street"
            id="street"
            required
            disabled={disabled}
            value={formData.street}
            onChange={handleChange}
            className="flex-1 rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={verifyAddress}
            disabled={disabled || isVerifying}
            className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <span className="ml-2">Verify</span>
          </button>
        </div>
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            name="city"
            id="city"
            required
            disabled={disabled}
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State/Province
          </label>
          <input
            type="text"
            name="state"
            id="state"
            required
            disabled={disabled}
            value={formData.state}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Country and Postal Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            name="country"
            id="country"
            required
            disabled={disabled}
            value={formData.country}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
            Postal Code
          </label>
          <input
            type="text"
            name="postal_code"
            id="postal_code"
            required
            disabled={disabled}
            value={formData.postal_code}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Coordinates */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Coordinates
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={getCurrentLocation}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <MapPinIcon className="h-5 w-5 mr-1" />
            Get Current Location
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
              Latitude
            </label>
            <input
              type="text"
              name="latitude"
              id="latitude"
              required
              disabled={disabled}
              value={formData.latitude}
              onChange={handleChange}
              pattern="-?\d*\.?\d*"
              title="Please enter a valid latitude (-90 to 90)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
              Longitude
            </label>
            <input
              type="text"
              name="longitude"
              id="longitude"
              required
              disabled={disabled}
              value={formData.longitude}
              onChange={handleChange}
              pattern="-?\d*\.?\d*"
              title="Please enter a valid longitude (-180 to 180)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

LocationEdit.propTypes = {
  property: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

MapEvents.propTypes = {
  onLocationSelect: PropTypes.func.isRequired
};

MapUpdater.propTypes = {
  center: PropTypes.array.isRequired
};

export default LocationEdit; 