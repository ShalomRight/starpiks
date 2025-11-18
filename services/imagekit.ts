
import { IMAGEKIT_CONFIG } from '../constants';

/**
 * Uploads an image to ImageKit using a secure, token-based authentication flow.
 *
 * IMPORTANT: This function requires a backend server to generate an authentication signature.
 * The `authenticationEndpoint` in `constants.ts` MUST point to your server.
 * See ImageKit docs for creating this endpoint: https://docs.imagekit.io/api-reference/security-and-authentication/authentication-v2
 *
 * @param {string} dataUrl - The base64 data URL of the image to upload.
 * @param {string} fileName - The desired file name for the uploaded image.
 * @returns {Promise<{ url: string; fileId: string }>} A promise that resolves with the URL and fileId of the uploaded image.
 */
export const uploadToImageKit = async (dataUrl: string, fileName: string): Promise<{ url: string; fileId: string }> => {
  // Step 1: Get authentication parameters from your backend server
  let authParams;
  try {
    const authResponse = await fetch(IMAGEKIT_CONFIG.authenticationEndpoint);
    if (!authResponse.ok) {
      throw new Error(`Authentication request failed with status: ${authResponse.status}`);
    }
    authParams = await authResponse.json();
    if (!authParams.signature || !authParams.expire || !authParams.token) {
      throw new Error('Invalid authentication parameters received from server.');
    }
  } catch (error) {
    console.error('Failed to fetch authentication parameters from backend:', error);
    throw new Error('Could not connect to the authentication server. Please ensure the backend is running and the `authenticationEndpoint` is configured correctly.');
  }
  
  // Step 2: Convert Data URL to Blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  // Step 3: Upload the file to ImageKit using the signature
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('fileName', fileName);
  formData.append('publicKey', IMAGEKIT_CONFIG.publicKey);
  formData.append('signature', authParams.signature);
  formData.append('expire', authParams.expire);
  formData.append('token', authParams.token);

  try {
    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('ImageKit upload failed:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }
    
    const result = await uploadResponse.json();
    
    return {
      url: result.url,
      fileId: result.fileId
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};