import React, { useState, useEffect } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const PhotosForm = ({ onChange, data = {} }) => {
  const formik = useFormik({
    initialValues: {
      photos: data.photos || []
    },
    validationSchema: Yup.object({
      photos: Yup.array()
        .min(1, 'At least one photo URL is required')
        .max(10, 'Maximum 10 photos allowed')
        .of(
          Yup.object().shape({
            url: Yup.string()
              .required('URL is required')
              .url('Must be a valid URL'),
            caption: Yup.string()
          })
        )
    }),
    onSubmit: (values) => {
      onChange({ photos: values.photos });
    }
  });

  const handleAddPhotoURL = () => {
    if (formik.values.photos.length >= 10) {
      return;
    }
    const newPhotos = [...formik.values.photos, { url: '', caption: '' }];
    formik.setFieldValue('photos', newPhotos);
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = formik.values.photos.filter((_, i) => i !== index);
    formik.setFieldValue('photos', newPhotos);
    onChange({ photos: newPhotos });
  };

  useEffect(() => {
    console.log('Current photos:', formik.values.photos);
  }, [formik.values.photos]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Property Photos</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add up to 10 photo URLs for your property. First photo will be the main image.
        </p>
      </div>

      <div className="space-y-4">
        {formik.values.photos.map((photo, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex-grow space-y-2">
              <div>
                <label htmlFor={`photos.${index}.url`} className="block text-sm font-medium text-gray-700">
                  Photo URL {index + 1}
                </label>
                <input
                  type="url"
                  name={`photos.${index}.url`}
                  id={`photos.${index}.url`}
                  value={photo.url}
                  onChange={(e) => {
                    formik.handleChange(e);
                    const newPhotos = [...formik.values.photos];
                    newPhotos[index].url = e.target.value;
                    onChange({ photos: newPhotos });
                  }}
                  onBlur={formik.handleBlur}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                {formik.touched.photos?.[index]?.url && formik.errors.photos?.[index]?.url && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.photos[index].url}</p>
                )}
              </div>
              
              <div>
                <label htmlFor={`photos.${index}.caption`} className="block text-sm font-medium text-gray-700">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  name={`photos.${index}.caption`}
                  id={`photos.${index}.caption`}
                  value={photo.caption}
                  onChange={(e) => {
                    formik.handleChange(e);
                    const newPhotos = [...formik.values.photos];
                    newPhotos[index].caption = e.target.value;
                    onChange({ photos: newPhotos });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Describe this photo"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRemovePhoto(index)}
              className="mt-6 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Remove
            </button>
          </div>
        ))}

        {formik.values.photos.length < 10 && (
          <button
            type="button"
            onClick={handleAddPhotoURL}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add Photo URL
          </button>
        )}

        {formik.touched.photos && formik.errors.photos && typeof formik.errors.photos === 'string' && (
          <p className="mt-2 text-sm text-red-600">{formik.errors.photos}</p>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Photo Guidelines:</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Use high-quality images (minimum 1024x768 pixels)</li>
          <li>First photo will be used as the cover image</li>
          <li>Include photos of all rooms and amenities</li>
          <li>Use direct image URLs (ending in .jpg, .png, etc.)</li>
          <li>Ensure URLs are publicly accessible</li>
          <li>Maximum 10 photos per property</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotosForm;
