import db from '../config/database.js';
import { createPropertiesTable } from '../models/property.model.js';
import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: nodeFetch,
});

async function getUnsplashImages(query, count = 4) {
  try {
    const result = await unsplash.search.getPhotos({
      query,
      perPage: count,
      orientation: 'landscape',
    });

    if (result.errors) {
      console.error('Error fetching Unsplash images:', result.errors[0]);
      return [];
    }

    return result.response.results.map(photo => ({
      url: photo.urls.regular,
      caption: photo.description || photo.alt_description || query
    }));
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return [];
  }
}

const demoProperties = [
  {
    name: "Luxury Penthouse in Dublin City Centre",
    description: "Stunning penthouse apartment with panoramic views of Dublin. Modern amenities and premium furnishings throughout.",
    latitude: 53.3498,
    longitude: -6.2603,
    street: "25 St. Stephen's Green",
    city: "Dublin",
    country: "Ireland",
    postal_code: "D02 X285",
    price: 250.00,
    rating: 4.8,
    host_id: 1,
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    property_type: "apartment",
    check_in_time: "15:00",
    check_out_time: "11:00",
    cancellation_policy: "Flexible",
    amenities: ["WiFi", "Air Conditioning", "Kitchen", "Washer", "Dryer", "Parking"],
    imageQuery: "luxury apartment interior",
    rules: ["No smoking", "No parties", "No pets"]
  },
  {
    name: "Cozy Cottage in Howth",
    description: "Charming seaside cottage with traditional Irish character and modern comforts.",
    latitude: 53.3873,
    longitude: -6.0654,
    street: "15 Harbor Road",
    city: "Howth",
    country: "Ireland",
    postal_code: "D13 P2X3",
    price: 150.00,
    rating: 4.9,
    host_id: 1,
    guests: 3,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    property_type: "house",
    check_in_time: "16:00",
    check_out_time: "10:00",
    cancellation_policy: "Moderate",
    amenities: ["WiFi", "Fireplace", "Kitchen", "Garden", "Sea View"],
    imageQuery: "cozy cottage interior",
    rules: ["No smoking", "Pets allowed", "Quiet hours after 10 PM"]
  },
  {
    name: "Modern Studio in Temple Bar",
    description: "Stylish studio apartment in the heart of Dublin's cultural quarter.",
    latitude: 53.3448,
    longitude: -6.2674,
    street: "42 Temple Bar",
    city: "Dublin",
    country: "Ireland",
    postal_code: "D02 YC63",
    price: 120.00,
    rating: 4.6,
    host_id: 1,
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    property_type: "apartment",
    check_in_time: "14:00",
    check_out_time: "11:00",
    cancellation_policy: "Strict",
    amenities: ["WiFi", "Kitchen", "City View", "Smart TV"],
    imageQuery: "modern studio apartment",
    rules: ["No smoking", "No parties", "No pets"]
  }
];

const seedDatabase = async () => {
  try {
    // Create tables if they don't exist
    await createPropertiesTable();

    // Clear existing data
    await db.query('DELETE FROM property_rules');
    await db.query('DELETE FROM property_amenities');
    await db.query('DELETE FROM property_images');
    await db.query('DELETE FROM properties');

    console.log('Cleared existing properties data');

    // Insert properties
    for (const property of demoProperties) {
      const {
        amenities, imageQuery, rules, ...propertyData
      } = property;

      // Fetch images from Unsplash
      const images = await getUnsplashImages(imageQuery);

      // Insert property
      const insertPropertyQuery = `
        INSERT INTO properties (
          name, description, latitude, longitude, street, city, country,
          postal_code, price, rating, host_id, guests, bedrooms, beds,
          bathrooms, property_type, check_in_time, check_out_time,
          cancellation_policy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const propertyValues = [
        propertyData.name,
        propertyData.description,
        propertyData.latitude,
        propertyData.longitude,
        propertyData.street,
        propertyData.city,
        propertyData.country,
        propertyData.postal_code,
        propertyData.price,
        propertyData.rating,
        propertyData.host_id,
        propertyData.guests,
        propertyData.bedrooms,
        propertyData.beds,
        propertyData.bathrooms,
        propertyData.property_type,
        propertyData.check_in_time,
        propertyData.check_out_time,
        propertyData.cancellation_policy
      ];

      const [result] = await db.query(insertPropertyQuery, propertyValues);
      const propertyId = result.insertId;

      // Insert amenities
      if (amenities?.length) {
        for (const amenity of amenities) {
          await db.query(
            'INSERT INTO property_amenities (property_id, amenity) VALUES (?, ?)',
            [propertyId, amenity]
          );
        }
      }

      // Insert images
      if (images?.length) {
        for (const image of images) {
          await db.query(
            'INSERT INTO property_images (property_id, url, caption) VALUES (?, ?, ?)',
            [propertyId, image.url, image.caption]
          );
        }
      }

      // Insert rules
      if (rules?.length) {
        for (const rule of rules) {
          await db.query(
            'INSERT INTO property_rules (property_id, rule) VALUES (?, ?)',
            [propertyId, rule]
          );
        }
      }
    }

    console.log(`Inserted ${demoProperties.length} properties with their related data`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
