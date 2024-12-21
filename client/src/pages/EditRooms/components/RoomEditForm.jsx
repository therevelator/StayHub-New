import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon,
  HomeIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  WifiIcon,
  TvIcon,
  LockClosedIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  SparklesIcon,
  MapPinIcon,
} from '@heroicons/react/20/solid';

console.log('Loading SIMPLIFIED RoomEditForm component - Version 1.0');

const BED_TYPES = [
  'Single Bed',
  'Double Bed',
  'Queen Bed',
  'King Bed',
  'Sofa Bed',
  'Bunk Bed',
];

const ROOM_TYPES = [
  'Standard Room',
  'Deluxe Room',
  'Suite',
  'Family Room',
  'Single Room',
  'Double Room',
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: WifiIcon },
  { id: 'tv', label: 'TV', icon: TvIcon },
  { id: 'safe', label: 'Safe', icon: LockClosedIcon },
  { id: 'coffee_maker', label: 'Coffee Maker', icon: BeakerIcon },
  { id: 'work_desk', label: 'Work Desk', icon: ComputerDesktopIcon },
  { id: 'telephone', label: 'Telephone', icon: PhoneIcon },
];

const RoomEditForm = ({ room, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: ROOM_TYPES[0],
    beds: [],
    max_occupancy: 1,
    base_price: '',
    description: '',
    amenities: [],
  });

  useEffect(() => {
    if (room) {
      setFormData({
        ...room,
        beds: Array.isArray(room.beds) ? room.beds : [],
        base_price: room.base_price?.toString() || '',
        max_occupancy: room.max_occupancy?.toString() || '1',
        amenities: room.amenities || [],
      });
    }
  }, [room]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    console.log('SIMPLIFIED Form Submit Handler - Version 1.0');
    console.log('Current form data:', formData);
    const dataToSubmit = {
      ...formData,
      base_price: parseFloat(formData.base_price) || 0,
      max_occupancy: parseInt(formData.max_occupancy, 10) || 1,
    };
    onUpdate(dataToSubmit);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Room Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Room Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {room ? 'Save Changes' : 'Add Room'}
          </button>
          {room && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Room
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default RoomEditForm;
