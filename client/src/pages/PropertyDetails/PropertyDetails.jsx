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
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        // First get the property data
        const response = await api.get(`/properties/${propertyId}`);
        const propertyData = response.data.data;
        
        // For each room, fetch its detailed data
        if (propertyData && propertyData.rooms) {
          try {
            const roomPromises = propertyData.rooms.map(async (room) => {
              try {
                const roomResponse = await api.get(`/properties/${propertyId}/rooms/${room.id}`);
                console.log('Room data from API:', roomResponse.data);
                // The API returns properly formatted data, no need for additional parsing
                return roomResponse.data.data;
              } catch (roomErr) {
                console.error(`Error fetching room ${room.id}:`, roomErr);
                return {
                  ...room,
                  beds: [],
                  amenities: [],
                  accessibility_features: [],
                  energy_saving_features: [],
                  climate: { type: 'ac', available: true },
                  images: []
                };
              }
            });

            propertyData.rooms = await Promise.all(roomPromises);
            console.log('All rooms with details:', propertyData.rooms);
          } catch (e) {
            console.error('Error fetching room details:', e);
          }
        }
        
        setProperty(propertyData);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.message || 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

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

  const getRoomPrice = (room) => {
    return Number(room.price_per_night) || Number(room.base_price) || 0;
  };

  const handleBookRoom = (roomId) => {
    navigate(`/property/${propertyId}/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 py-8">
        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Left Column - Property Info */}
          <div className="lg:col-span-2">
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
            <div className="mb-8 max-w-4xl mx-auto">
              {/* Main Image */}
              <div className="relative aspect-[16/10] mb-4 overflow-hidden rounded-xl shadow-lg">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={property.photos[selectedImage].url}
                    alt={`${property.basicInfo?.name} - View ${selectedImage + 1}`}
                    className="object-cover w-full h-full transform transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                    <HomeIcon className="h-20 w-20 text-gray-300" />
                  </div>
                )}
                {/* Navigation Arrows */}
                {property.photos && property.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === 0 ? property.photos.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === property.photos.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-20 overflow-x-auto">
                {property.photos?.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-[16/10] overflow-hidden rounded-lg transition-all duration-200 ${
                      selectedImage === index 
                        ? 'ring-2 ring-primary-500 ring-offset-2' 
                        : 'hover:opacity-80'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={`${property.basicInfo?.name} - Thumbnail ${index + 1}`}
                      className="object-cover w-full h-full"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.amenities ? (
                  typeof property.amenities === 'object' && !Array.isArray(property.amenities) ? (
                    // Handle object format with categories
                    Object.entries(property.amenities).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="font-semibold text-gray-700 mb-2 capitalize">{category}</h3>
                        {Array.isArray(items) ? items.map((item, index) => (
                          <div key={`${category}-${index}`} className="flex items-center mb-2">
                            <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2" />
                            <span className="text-gray-600">
                              {typeof item === 'object' ? item.amenity || item.name : item}
                            </span>
                          </div>
                        )) : null}
                      </div>
                    ))
                  ) : Array.isArray(property.amenities) ? (
                    // Handle array format
                    property.amenities.map((item, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-primary-600 mr-2" />
                        <span className="text-gray-600">
                          {typeof item === 'object' ? item.amenity || item.name : item}
                        </span>
                      </div>
                    ))
                  ) : null
                ) : null}
              </div>
            </div>
          </div>

          {/* Right Column - Available Rooms */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Available Rooms</h2>
            {property.rooms?.map((room) => {
              const price = getRoomPrice(room);
              console.log('Rendering room:', room);
              
              // Parse room data if needed
              // Room data is already parsed by the backend
              const roomData = room;
              console.log('Room data:', roomData);
              console.log('Beds data:', roomData.beds);
              
              return (
                <div key={roomData.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold mb-2">{roomData.name}</h3>
                  <p className="text-gray-600 mb-4">{roomData.room_type} • Max Occupancy: {roomData.max_occupancy}</p>
                  
                  {/* Beds */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Beds:</h4>
                    {roomData.beds && roomData.beds.length > 0 ? (
                      roomData.beds.map((bed, index) => (
                        <p key={index} className="text-gray-600">
                          {bed.count}x {bed.type}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-600">1x Single Bed</p>
                    )}
                  </div>

                  {/* Room Amenities */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Room Amenities:</h4>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
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
                      {Array.isArray(room.amenities) && room.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-primary-600 mr-2" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4 text-xl font-bold">
                    <div className="flex justify-between items-center">
                      <span>Price per night</span>
                      <span>${price.toFixed(2)}</span>
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
