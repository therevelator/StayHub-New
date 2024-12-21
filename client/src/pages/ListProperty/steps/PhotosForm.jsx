import React, { useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PhotosForm = ({ onSubmit, initialValues = {} }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previewImages, setPreviewImages] = useState(initialValues.photos || []);

  const formik = useFormik({
    initialValues: {
      photos: initialValues.photos || []
    },
    validationSchema: Yup.object({
      photos: Yup.array()
        .min(1, 'At least one photo is required')
        .required('Photos are required')
    }),
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    const newImages = [...previewImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setPreviewImages(newImages);
    formik.setFieldValue('photos', newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...previewImages];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result);
        setPreviewImages([...newImages]);
        formik.setFieldValue('photos', newImages);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newImages);
    formik.setFieldValue('photos', newImages);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Property Photos</h2>
          <p className="text-sm text-gray-500">Drag to reorder</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewImages.map((image, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="relative group aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500"
            >
              <img
                src={image}
                alt={`Property ${index + 1}`}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4 text-gray-600" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 rounded text-xs font-medium">
                  Cover Photo
                </span>
              )}
            </div>
          ))}

          <label className="relative block aspect-w-16 aspect-h-9 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 cursor-pointer">
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-500">Add photos</span>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {formik.touched.photos && formik.errors.photos && (
          <p className="text-sm text-red-600 mt-2">{formik.errors.photos}</p>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Photo Guidelines:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>Upload high-quality images (minimum 1024x768 pixels)</li>
            <li>First photo will be used as the cover image</li>
            <li>Include photos of all rooms and amenities</li>
            <li>Avoid watermarks or text overlays</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => formik.resetForm()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Save and Continue
        </button>
      </div>
    </form>
  );
};

export default PhotosForm;
