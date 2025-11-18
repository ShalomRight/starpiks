
import { type Photo } from '../types';

export const storage = {
  async getPhotos(): Promise<Photo[]> {
    const data = localStorage.getItem('photos');
    return data ? JSON.parse(data) : [];
  },
  async savePhoto(photo: Photo): Promise<void> {
    let photos = await this.getPhotos();
    // Update if exists, else add new
    const existingIndex = photos.findIndex(p => p.id === photo.id);
    if (existingIndex > -1) {
      photos[existingIndex] = photo;
    } else {
      photos.push(photo);
    }
    localStorage.setItem('photos', JSON.stringify(photos));
  },
  async deletePhotos(ids: string[]): Promise<void> {
    const photos = await this.getPhotos();
    const filtered = photos.filter(p => !ids.includes(p.id));
    localStorage.setItem('photos', JSON.stringify(filtered));
  }
};
