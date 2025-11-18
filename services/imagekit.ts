
import { IMAGEKIT_CONFIG } from '../constants';

export const uploadToImageKit = async (dataUrl: string, fileName: string): Promise<{ url: string; fileId: string }> => {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('fileName', fileName);
    formData.append('publicKey', IMAGEKIT_CONFIG.publicKey);
    
    const authHeaders = new Headers();
    authHeaders.append('Authorization', `Basic ${btoa(IMAGEKIT_CONFIG.publicKey + ':')}`);

    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formData
    });
    
    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('ImageKit upload failed:', errorText);
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
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
