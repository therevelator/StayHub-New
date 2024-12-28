import React, { useState, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map center marker component
function DraggableMarker({ position, onPositionChange }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onPositionChange([position.lat, position.lng]);
        },
      }}
    />
  );
}

const LocationForm = ({ data = {}, onChange }) => {
  const [mapCenter, setMapCenter] = useState([
    data.latitude || 51.505,
    data.longitude || -0.09
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: value
    });
  };

  const handleMapPositionChange = ([lat, lng]) => {
    onChange({
      ...data,
      latitude: lat,
      longitude: lng
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Property Location</h2>
        <p className="text-sm text-gray-600 mt-1">
          Enter your property's address and verify its location on the map
        </p>
      </div>

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
              name="street"
              value={data.street || ''}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={data.city || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State/Province
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={data.state || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              required
            />
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
              name="country"
              value={data.country || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={data.postalCode || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verify Location on Map
          </label>
          <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <DraggableMarker
                position={mapCenter}
                onPositionChange={handleMapPositionChange}
              />
            </MapContainer>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Drag the marker to adjust the exact location of your property
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationForm;
