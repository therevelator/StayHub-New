import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import propertyService from '../../../../services/propertyService';

const PhotosEdit = ({ propertyId, photos = [], onUpdate, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a supported image type`);
      }
      if (!isValidSize) {
        toast.error(`${file.name} exceeds the 5MB size limit`);
      }
      
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('photos', file);
      });

      await propertyService.uploadPhotos(propertyId, formData);
      onUpdate();
      toast.success('Photos uploaded successfully');
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (photoId) => {
    try {
      await propertyService.deletePhoto(propertyId, photoId);
      onUpdate();
      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleUpdateCaption = async (photoId, caption) => {
    try {
      await propertyService.updatePhotoCaption(propertyId, photoId, { caption });
      onUpdate();
      toast.success('Caption updated successfully');
    } catch (error) {
      console.error('Error updating caption:', error);
      toast.error('Failed to update caption');
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Property Photos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add photos of your property. Supported formats: JPG, PNG, WebP. Max size: 5MB per photo.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <PhotoIcon className="h-5 w-5 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Property photo'}
                className="w-full h-48 object-cover"
              />
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200" />
              
              {/* Caption Input */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white bg-opacity-90">
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                  placeholder="Add a caption..."
                  disabled={disabled}
                  className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                disabled={disabled}
                className="absolute top-2 right-2 p-1 rounded-full bg-white bg-opacity-75 text-gray-900 hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No photos uploaded yet</p>
        </div>
      )}
    </div>
  );
};

PhotosEdit.propTypes = {
  propertyId: PropTypes.string.isRequired,
  photos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    caption: PropTypes.string
  })),
  onUpdate: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default PhotosEdit; 