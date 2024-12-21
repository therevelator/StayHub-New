import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';

const RoomsForm = ({ onSubmit, initialValues = {} }) => {
  const formik = useFormik({
    initialValues: {
      rooms: initialValues.rooms || [
        {
          type: 'Standard',
          quantity: 1,
          capacity: 2,
          beds: [{ type: 'Queen', count: 1 }],
          basePrice: '',
          amenities: [],
          bathroomType: 'Private'
        }
      ]
    },
    validationSchema: Yup.object({
      rooms: Yup.array().of(
        Yup.object({
          type: Yup.string().required('Room type is required'),
          quantity: Yup.number()
            .min(1, 'Must have at least 1 room')
            .required('Quantity is required'),
          capacity: Yup.number()
            .min(1, 'Must accommodate at least 1 person')
            .required('Capacity is required'),
          beds: Yup.array().of(
            Yup.object({
              type: Yup.string().required('Bed type is required'),
              count: Yup.number()
                .min(1, 'Must have at least 1 bed')
                .required('Number of beds is required')
            })
          ),
          basePrice: Yup.number()
            .min(0, 'Price cannot be negative')
            .required('Base price is required'),
          amenities: Yup.array().of(Yup.string()),
          bathroomType: Yup.string().required('Bathroom type is required')
        })
      )
    }),
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  const [newAmenity, setNewAmenity] = useState('');

  const handleAddAmenity = (roomIndex) => {
    if (!newAmenity.trim()) return;
    
    const currentAmenities = formik.values.rooms[roomIndex].amenities;
    if (currentAmenities.includes(newAmenity.trim())) {
      alert('This amenity already exists!');
      return;
    }

    const updatedRooms = [...formik.values.rooms];
    updatedRooms[roomIndex].amenities.push(newAmenity.trim());
    formik.setFieldValue('rooms', updatedRooms);
    setNewAmenity('');
  };

  const handleRemoveAmenity = (roomIndex, amenityIndex) => {
    const updatedRooms = [...formik.values.rooms];
    updatedRooms[roomIndex].amenities.splice(amenityIndex, 1);
    formik.setFieldValue('rooms', updatedRooms);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        {formik.values.rooms.map((room, roomIndex) => (
          <div key={roomIndex} className="bg-white shadow-lg border-2 border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-xl">
            {/* Room Header */}
            <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <select
                  name={`rooms.${roomIndex}.type`}
                  value={room.type}
                  onChange={formik.handleChange}
                  className="rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                >
                  <option value="Standard">Standard Room</option>
                  <option value="Deluxe">Deluxe Room</option>
                  <option value="Suite">Suite</option>
                </select>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    name={`rooms.${roomIndex}.quantity`}
                    value={room.quantity}
                    onChange={formik.handleChange}
                    className="block w-24 rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                    placeholder="Qty"
                  />
                  <span className="text-base font-medium text-gray-600">rooms</span>
                </div>
              </div>
              {formik.values.rooms.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedRooms = [...formik.values.rooms];
                    updatedRooms.splice(roomIndex, 1);
                    formik.setFieldValue('rooms', updatedRooms);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-8">
              {/* Room Details Grid */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Capacity</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      name={`rooms.${roomIndex}.capacity`}
                      value={room.capacity}
                      onChange={formik.handleChange}
                      className="block w-24 rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                    />
                    <span className="text-base font-medium text-gray-600">guests</span>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Price per Night</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-600 text-base">$</span>
                    </div>
                    <input
                      type="number"
                      name={`rooms.${roomIndex}.basePrice`}
                      value={room.basePrice}
                      onChange={formik.handleChange}
                      className="block w-full pl-8 rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Bathroom</label>
                  <select
                    name={`rooms.${roomIndex}.bathroomType`}
                    value={room.bathroomType}
                    onChange={formik.handleChange}
                    className="block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                  >
                    <option value="Private">Private Bathroom</option>
                    <option value="Shared">Shared Bathroom</option>
                  </select>
                </div>
              </div>

              {/* Beds Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-base font-medium text-gray-700">Bed Configuration</label>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedRooms = [...formik.values.rooms];
                      updatedRooms[roomIndex].beds.push({ type: 'Single', count: 1 });
                      formik.setFieldValue('rooms', updatedRooms);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 border-2 border-primary-200 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Bed
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {room.beds.map((bed, bedIndex) => (
                    <div key={bedIndex} className="flex items-center space-x-3 bg-white rounded-lg p-3 border-2 border-gray-200">
                      <select
                        name={`rooms.${roomIndex}.beds.${bedIndex}.type`}
                        value={bed.type}
                        onChange={formik.handleChange}
                        className="block flex-1 rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                      >
                        <option value="Single">Single Bed</option>
                        <option value="Double">Double Bed</option>
                        <option value="Queen">Queen Bed</option>
                        <option value="King">King Bed</option>
                      </select>
                      <input
                        type="number"
                        name={`rooms.${roomIndex}.beds.${bedIndex}.count`}
                        value={bed.count}
                        onChange={formik.handleChange}
                        className="block w-20 rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedRooms = [...formik.values.rooms];
                          updatedRooms[roomIndex].beds.splice(bedIndex, 1);
                          formik.setFieldValue('rooms', updatedRooms);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-lg"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-base font-medium text-gray-700">Room Amenities</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAmenity(roomIndex);
                        }
                      }}
                      placeholder="Add amenity..."
                      className="block w-48 rounded-lg border-2 border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base py-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAmenity(roomIndex)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 border-2 border-primary-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {room.amenities.map((amenity, amenityIndex) => (
                    <span
                      key={amenityIndex}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-white border-2 border-gray-200"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(roomIndex, amenityIndex)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            formik.setFieldValue('rooms', [
              ...formik.values.rooms,
              {
                type: 'Standard',
                quantity: 1,
                capacity: 2,
                beds: [{ type: 'Queen', count: 1 }],
                basePrice: '',
                amenities: [],
                bathroomType: 'Private'
              }
            ]);
          }}
          className="inline-flex items-center px-6 py-3 border-2 border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <PlusIcon className="h-6 w-6 mr-2" />
          Add Another Room Type
        </button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center px-6 py-3 border-2 border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default RoomsForm;