import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StarIcon as StarIconSolid } from '@heroicons/react/20/solid';
import { 
  PencilIcon, 
  MapPinIcon, 
  UserGroupIcon,
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon as StarIconOutline 
} from '@heroicons/react/20/solid';
import api from '../../services/api';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/properties/${id}`);
        console.log('API Response:', response.data);
        // Log the room amenities specifically
        response.data.data.rooms?.forEach(room => {
          console.log('Room amenities for', room.name, ':', room.amenities);
        });
        setProperty(response.data.data); // Access the data property from the response
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.message || 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (!property) return null;

  const calculateRoomTotalPrice = (room) => {
    const basePrice = Number(room.base_price) || 0;
    const cleaningFee = Number(room.cleaning_fee) || 0;
    const serviceFee = Number(room.service_fee) || 0;
    const taxRate = Number(room.tax_rate) || 0;
    
    const subtotal = basePrice + cleaningFee + serviceFee;
    const taxAmount = subtotal * taxRate / 100;
    return subtotal + taxAmount;
  };

  const handleBookRoom = (roomId) => {
    navigate(`/property/${id}/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 py-8">
        {/* Property Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column - Property Info */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-4">{property.basicInfo?.name}</h1>
            
            {/* Location and Rating */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>{`${property.location?.city}, ${property.location?.country}`}</span>
              </div>
              <div className="flex items-center">
                <StarIconSolid className="h-5 w-5 text-yellow-400 mr-1" />
                <span className="font-semibold">{property.basicInfo?.rating?.toFixed(1) || 'New'}</span>
                <span className="text-gray-600 ml-1">({property.basicInfo?.total_reviews} reviews)</span>
              </div>
            </div>

            {/* Property Images */}
            <div className="mb-8">
              <div className="aspect-w-16 aspect-h-9 mb-4">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={property.photos[selectedImage].url}
                    alt={`${property.basicInfo?.name} - View ${selectedImage + 1}`}
                    className="object-cover w-full h-full rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <HomeIcon className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-4">
                {property.photos?.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-w-16 aspect-h-9 ${
                      selectedImage === index ? 'ring-2 ring-primary-500' : ''
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={`${property.basicInfo?.name} - Thumbnail ${index + 1}`}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">About this property</h2>
              <p className="text-gray-600">{property.basicInfo?.description}</p>
            </div>

            {/* Property Amenities */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Property Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(property.amenities || {}).map(([category, amenities]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-gray-700 mb-2 capitalize">{category}</h3>
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2" />
                        <span className="text-gray-600">{amenity}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Available Rooms */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-semibold mb-4">Available Rooms</h2>
            {property.rooms?.map((room) => {
              const totalPrice = calculateRoomTotalPrice(room);
              
              return (
                <div key={room.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow mb-4">
                  <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                  <p className="text-gray-600 mb-4">{room.room_type} • Max Occupancy: {room.max_occupancy}</p>
                  
                  {/* Beds */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Beds:</h4>
                    {Array.isArray(room.beds) ? (
                      room.beds.map((bed, index) => (
                        <p key={index} className="text-gray-600">{bed.count}x {bed.type}</p>
                      ))
                    ) : room.beds ? (
                      <p className="text-gray-600">{room.beds.count}x {room.beds.type}</p>
                    ) : null}
                  </div>

                  {/* Room Amenities */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Room Amenities:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Boolean amenities */}
                      {room.has_private_bathroom === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Private Bathroom</span>
                        </div>
                      )}
                      {room.has_balcony === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Balcony</span>
                        </div>
                      )}
                      {room.has_kitchen === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Kitchen</span>
                        </div>
                      )}
                      {room.has_minibar === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Minibar</span>
                        </div>
                      )}
                      {room.has_toiletries === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Toiletries</span>
                        </div>
                      )}
                      {room.has_towels_linens === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Towels & Linens</span>
                        </div>
                      )}
                      {room.has_room_service === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Room Service</span>
                        </div>
                      )}
                      {room.includes_breakfast === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Breakfast Included</span>
                        </div>
                      )}
                      {room.extra_bed_available === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Extra Bed Available</span>
                        </div>
                      )}
                      {room.pets_allowed === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Pets Allowed</span>
                        </div>
                      )}
                      {room.smoking === 1 && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>Smoking Allowed</span>
                        </div>
                      )}

                      {/* Other room features */}
                      {room.bathroom_type && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>{room.bathroom_type} Bathroom</span>
                        </div>
                      )}
                      {room.view_type && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>{room.view_type}</span>
                        </div>
                      )}
                      {room.flooring_type && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>{room.flooring_type} Flooring</span>
                        </div>
                      )}
                      {room.cleaning_frequency && (
                        <div className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>{room.cleaning_frequency.replace('_', ' ')} Cleaning</span>
                        </div>
                      )}

                      {/* Additional amenities */}
                      {(room.amenities || []).map((amenity, index) => (
                        <div key={index} className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Base price</span>
                      <span>${Number(room.base_price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Cleaning fee</span>
                      <span>${Number(room.cleaning_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Service fee</span>
                      <span>${Number(room.service_fee).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes ({room.tax_rate}%)</span>
                      <span>${(totalPrice - (Number(room.base_price) + Number(room.cleaning_fee) + Number(room.service_fee))).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookRoom(room.id)}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors mt-4"
                  >
                    Book this Room
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
