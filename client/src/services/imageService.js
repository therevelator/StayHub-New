import api from './api';

const IMGBB_API_KEY = '6d75f9f8a402659f3fa1cca8878af889'; // Replace with your ImgBB API key

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', IMGBB_API_KEY);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        url: data.data.url,
        delete_url: data.data.delete_url,
        thumbnail: data.data.thumb?.url || data.data.url,
      };
    } else {
      throw new Error(data.error?.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const uploadMultipleImages = async (files) => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImage(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple images upload error:', error);
    throw new Error('Failed to upload one or more images');
  }
};
