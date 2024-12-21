import { findPropertiesInRadius, getPropertyDetails, getPropertyById, createProperty, updateProperty, deleteProperty } from '../models/property.model.js';
import { createRoom, getRoomsByPropertyId } from '../models/room.model.js';
import axios from 'axios';
import db from '../db/index.js';

// Function to map frontend property types to database enum values
const mapPropertyType = (frontendType) => {
  const validTypes = ['hotel', 'apartment', 'villa', 'resort', 'guesthouse', 'hostel'];
  const type = frontendType?.toLowerCase();
  return validTypes.includes(type) ? type : 'hotel';
};

// Function to get coordinates from address using OpenStreetMap Nominatim
const getCoordinates = async (address) => {
  try {
    console.log('Geocoding address:', address);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
    console.log('Geocoding URL:', url);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'StayHub Property Listing App'
      }
    });

    console.log('Geocoding response:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      console.log('Found coordinates:', { latitude: lat, longitude: lon });
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    }
    throw new Error('Location not found');
  } catch (error) {
    console.error('Geocoding error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw new Error('Failed to get coordinates for the address');
  }
};

const searchProperties = async (req, res) => {
  try {
    const { location, guests = 1, type, lat, lon, radius = 25 } = req.query;
    console.log('Search params:', { location, guests, type, lat, lon, radius });

    let query = `
      SELECT 
        p.*,
        u.email as host_email,
        u.first_name as host_first_name,
        u.last_name as host_last_name,
        (
          SELECT pi.url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          LIMIT 1
        ) as imageUrl,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'type', r.room_type,
              'beds', r.beds,
              'maxOccupancy', r.max_occupancy,
              'basePrice', r.base_price,
              'cleaningFee', r.cleaning_fee,
              'serviceFee', r.service_fee,
              'taxRate', r.tax_rate,
              'securityDeposit', r.security_deposit
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms,
    `;

    // Add distance calculation when coordinates are provided
    if (lat && lon) {
      query += `
        ST_Distance_Sphere(
          point(p.longitude, p.latitude),
          point(?, ?)
        ) * 0.001 as distance_km
      `;
    } else {
      query += ` NULL as distance_km`;
    }

    query += ` FROM properties p
      LEFT JOIN users u ON p.host_id = u.id COLLATE utf8mb4_unicode_ci
      WHERE p.is_active = 1
    `;

    const queryParams = [];
    if (lat && lon) {
      queryParams.push(parseFloat(lon), parseFloat(lat));
    }

    if (guests) {
      query += ' AND p.guests >= ?';
      queryParams.push(parseInt(guests));
    }

    if (type) {
      query += ' AND p.property_type = ?';
      queryParams.push(type);
    }

    if (location) {
      query += ' AND (LOWER(p.city) LIKE ? OR LOWER(p.country) LIKE ? OR LOWER(p.state) LIKE ?)';
      const searchLocation = `%${location.toLowerCase()}%`;
      queryParams.push(searchLocation, searchLocation, searchLocation);
    }

    // When coordinates are provided, filter by radius and order by distance
    if (lat && lon) {
      query += ` HAVING distance_km <= ?
                ORDER BY distance_km ASC`;
      queryParams.push(parseFloat(radius));
    } else {
      // Default ordering
      query += ' ORDER BY p.created_at DESC';
    }

    console.log('Executing query:', { query, params: queryParams });

    const [properties] = await db.query(query, queryParams);
    console.log(`Found ${properties.length} properties`);

    // Transform the properties
    const formattedProperties = properties.map(property => {
      const rooms = typeof property.rooms === 'string' 
        ? JSON.parse(property.rooms)
        : property.rooms;

      const lowestPrice = rooms?.reduce((min, room) => {
        const price = parseFloat(room.basePrice || room.base_price);
        return price < min ? price : min;
      }, Infinity) || 0;

      return {
        ...property,
        rooms: rooms || [],
        price: lowestPrice,
        is_active: property.is_active === 1,
        distance: property.distance_km ? 
          Math.round(property.distance_km * 10) / 10 : null // Round to 1 decimal
      };
    });

    res.json({
      status: 'success',
      data: formattedProperties
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching properties',
      error: error.message
    });
  }
};

const getPropertyDetailsById = async (req, res) => {
  try {
    console.log('Getting property details for ID:', req.params.id);
    if (!req.params.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Property ID is required'
      });
    }

    const { id } = req.params;
    
    console.log('Fetching property from database...');
    const property = await getPropertyById(id);
    console.log('Property from database:', property);
    
    if (!property) {
      console.log('Property not found');
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }
    
    console.log('Fetching rooms for property...');
    const rooms = await getRoomsByPropertyId(id);
    console.log('Rooms from database:', rooms);
    
    const response = {
      status: 'success',
      data: {
        ...property,
        rooms
      }
    };
    console.log('Sending response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Error in getPropertyDetailsById:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch property details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const createNewProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      host_id: req.user.userId
    };

    const newProperty = await createProperty(propertyData);
    console.log('New property created:', newProperty);

    res.status(201).json({
      status: 'success',
      data: {
        id: newProperty.id,
        name: newProperty.basicInfo.name,
        description: newProperty.basicInfo.description,
        created_at: newProperty.created_at,
        updated_at: newProperty.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const updatePropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Add debug logging
    console.log('Update property request:', {
      userId: req.user?.userId,
      userRole: req.user?.role,
      propertyId: id
    });
    
    // First check if property exists and get owner info
    const property = await getPropertyById(id);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    console.log('Property details:', {
      hostId: property.host_id,
      requestUserId: req.user?.userId,
      userRole: req.user?.role
    });

    // Check if this is a status update or full property update
    if (req.body.hasOwnProperty('is_active')) {
      // Status update - allow both admin and owner
      if (req.user.role !== 'admin' && req.user.userId !== property.host_id) {
        return res.status(403).json({ 
          status: 'error',
          message: 'Only administrators and property owners can update property status' 
        });
      }

      await db.query(
        'UPDATE properties SET is_active = ? WHERE id = ?',
        [req.body.is_active, id]
      );
    } else {
      // Full property update - allow both admin and owner
      if (req.user.role !== 'admin' && req.user.userId !== property.host_id) {
        console.log('Authorization failed:', {
          userRole: req.user.role,
          userId: req.user.userId,
          hostId: property.host_id
        });
        return res.status(403).json({ 
          status: 'error',
          message: 'Only administrators and property owners can update this property' 
        });
      }

      const updatedProperty = await updateProperty(id, req.body);
      return res.json({
        status: 'success',
        data: updatedProperty
      });
    }

    res.json({
      status: 'success',
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

const deletePropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only allow admin to delete properties
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        status: 'error',
        message: 'Only administrators can delete properties' 
      });
    }

    // Check if property exists
    const property = await getPropertyById(id);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    await deleteProperty(id);
    res.json({
      status: 'success',
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getAllProperties = async (req, res) => {
  try {
    console.log('Getting all properties. User:', req.user);

    // Default query without user filtering
    let query = `
      SELECT 
        p.*,
        u.email as host_email,
        u.first_name as host_first_name,
        u.last_name as host_last_name,
        (
          SELECT pi.url 
          FROM property_images pi 
          WHERE pi.property_id = p.id 
          LIMIT 1
        ) as imageUrl,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'name', r.name,
              'type', r.room_type,
              'beds', r.beds,
              'maxOccupancy', r.max_occupancy,
              'basePrice', r.base_price,
              'cleaningFee', r.cleaning_fee,
              'serviceFee', r.service_fee,
              'taxRate', r.tax_rate,
              'securityDeposit', r.security_deposit
            )
          )
          FROM rooms r
          WHERE r.property_id = p.id
        ) as rooms
      FROM properties p
      LEFT JOIN users u ON p.host_id COLLATE utf8mb4_0900_ai_ci = u.id COLLATE utf8mb4_0900_ai_ci
      WHERE 1=1
    `;

    let queryParams = [];

    // Add user filtering only if user exists and is NOT admin
    if (req.user && req.user.role !== 'admin') {
      query += ' AND p.host_id COLLATE utf8mb4_0900_ai_ci = ? COLLATE utf8mb4_0900_ai_ci';
      queryParams.push(req.user.userId);
    } else {
      // For public view or admin view, only show active properties
      if (!req.user || req.user.role !== 'admin') {
        query += ' AND p.is_active = 1';
      }
    }

    // Add ordering
    query += ' ORDER BY p.created_at DESC';

    console.log('Executing query:', {
      query,
      params: queryParams,
      user: req.user || 'No user'
    });

    const [properties] = await db.query(query, queryParams);
    
    console.log(`Found ${properties.length} properties`);
    
    // Transform the properties to include room data
    const formattedProperties = properties.map(property => {
      // Parse rooms if it's a string, otherwise use as is
      const rooms = typeof property.rooms === 'string' 
        ? JSON.parse(property.rooms)
        : property.rooms;

      // Get the lowest room price
      const lowestPrice = rooms?.reduce((min, room) => {
        const price = parseFloat(room.basePrice || room.base_price);
        return price < min ? price : min;
      }, Infinity) || 0;

      return {
        ...property,
        rooms: rooms || [],
        price: lowestPrice, // Use lowest room price as property price
        is_active: property.is_active === 1 // Ensure boolean value
      };
    });

    res.json({
      status: 'success',
      data: formattedProperties
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching properties',
      details: error.message
    });
  }
};

export const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    console.log('Updating property status:', { id, is_active });

    // First check if property exists and get owner info
    const property = await getPropertyById(id);
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    // Update the property status
    const [result] = await db.query(
      'UPDATE properties SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Property not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Property status updated successfully'
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating property status',
      error: error.message
    });
  }
};

export { searchProperties, getPropertyDetailsById, createNewProperty, updatePropertyById, deletePropertyById };
