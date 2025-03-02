import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';

const PropertyCard = ({ property, onClick, sx = {} }) => {
  // Debug the incoming property data
  console.log(`PropertyCard for ${property.id}:`, {
    originalPrice: property.price,
    hasRooms: property.rooms && Array.isArray(property.rooms),
    roomCount: property.rooms && Array.isArray(property.rooms) ? property.rooms.length : 0,
    roomPrices: property.rooms && Array.isArray(property.rooms) ? 
      property.rooms.map(r => ({ id: r.id, price_per_night: r.price_per_night })) : []
  });
  
  // Ensure we're using price_per_night if available
  const propertyWithCorrectPrice = { ...property };
  
  // If property has rooms with price_per_night, use the lowest one
  if (propertyWithCorrectPrice.rooms && Array.isArray(propertyWithCorrectPrice.rooms) && propertyWithCorrectPrice.rooms.length > 0) {
    const prices = propertyWithCorrectPrice.rooms
      .map(room => {
        const price = room.price_per_night ? parseFloat(room.price_per_night) : 0;
        console.log(`Room ${room.id} price_per_night:`, price);
        return price;
      })
      .filter(price => price > 0);
    
    console.log(`Property ${property.id} all prices:`, prices);
    
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      console.log(`Property ${property.id} min price:`, minPrice);
      propertyWithCorrectPrice.price = minPrice;
    }
  }
  
  const {
    name,
    description,
    price,
    rating = 0,
    imageUrl,
    location,
  } = propertyWithCorrectPrice;

  const mainImage = imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Link to={`/property/${property.id}`} className="block" onClick={onClick}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="relative aspect-w-16 aspect-h-9">
          <img
            src={mainImage}
            alt={name}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{name}</h3>
            {rating && (
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 text-yellow-400" />
                <span className="ml-1 text-sm text-gray-600">{rating}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{location}</p>

          <p
            className="text-sm text-gray-600 mb-2"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </p>

          <div className="flex justify-between items-center mt-2">
            <div>
              <span className="text-lg font-semibold text-gray-900">€{Number(price).toFixed(2)}</span>
              <span className="text-sm text-gray-600"> /night</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
