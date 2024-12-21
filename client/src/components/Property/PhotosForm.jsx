import React from 'react';
import {
  Box,
  ImageList,
  ImageListItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from ' ';

const PHOTO_CATEGORIES = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'interior', label: 'Interior' },
  { value: 'room', label: 'Room' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'view', label: 'View' },
  { value: 'amenity', label: 'Amenity' },
  { value: 'dining', label: 'Dining' }
];

const PhotosForm = ({ photos, onPhotoChange }) => {
  const handleCategoryChange = (index, newCategory) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = {
      ...updatedPhotos[index],
      category: newCategory
    };
    onPhotoChange(updatedPhotos);
  };

  const handleCaptionChange = (index, newCaption) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = {
      ...updatedPhotos[index],
      caption: newCaption
    };
    onPhotoChange(updatedPhotos);
  };

  return (
    <Box>
      <ImageList sx={{ width: '100%' }} cols={3} rowHeight={300}>
        {photos.map((photo, index) => (
          <ImageListItem key={index}>
            <img
              src={photo.url}
              alt={photo.caption || `Property photo ${index + 1}`}
              loading="lazy"
              style={{ height: 200, objectFit: 'cover' }}
            />
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={photo.category || ''}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                label="Category"
              >
                {PHOTO_CATEGORIES.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Caption"
              value={photo.caption || ''}
              onChange={(e) => handleCaptionChange(index, e.target.value)}
              sx={{ mt: 1 }}
            />
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  );
};

export default PhotosForm; 