import { CLOUDINARY_CONFIG } from '../constants';

/**
 * Uploads an image to Cloudinary using a direct, unsigned upload method.
 *
 * @param {string} photoDataUrl - The base64 data URL of the image to upload.
 * @returns {Promise<string>} A promise that resolves with the secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (photoDataUrl: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', photoDataUrl);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};
