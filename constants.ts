
import { type Frame } from './types';

// ImageKit Configuration
export const IMAGEKIT_CONFIG = {
  publicKey: 'public_o4D6y3LvPk8OlRyddoNdone+Qpc=',
  urlEndpoint: 'https://ik.imagekit.io/bcmzxhknk3/',
  authenticationEndpoint: 'https://ik.imagekit.io/bcmzxhknk3/auth'
};

// Frame data - these PNG files should be in public/frames/
export const FRAMES: Frame[] = [
  { id: 'default-1', name: 'Classic Border', category: 'minimal', url: '/frames/default-1.png' },
  { id: 'default-2', name: 'Elegant Frame', category: 'minimal', url: '/frames/default-2.png' },
  { id: 'default-3', name: 'Party Vibes', category: 'fun', url: '/frames/default-3.png' },
  { id: 'default-4', name: 'Event Special', category: 'events', url: '/frames/default-4.png' },
  { id: 'default-5', name: 'Celebration', category: 'events', url: '/frames/default-5.png' },
];

export const CATEGORIES = ['All Frames', 'Minimal', 'Events', 'Fun'];
