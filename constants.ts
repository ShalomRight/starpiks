
import { type Frame } from './types';

// ImageKit Configuration
export const IMAGEKIT_CONFIG = {
  publicKey: 'public_o4D6y3LvPk8OlRyddoNdone+Qpc=',
  urlEndpoint: 'https://ik.imagekit.io/bcmzxhknk3/',
  authenticationEndpoint: 'https://ik.imagekit.io/bcmzxhknk3/auth'
};

// Frame data - these PNG files should be in public/frames/
export const FRAMES: Frame[] = [
  { id: 'default-1', name: 'Classic Border', category: 'minimal', url: '/frames/classic-border.png' },
  { id: 'default-2', name: 'Elegant Frame', category: 'minimal', url: '/frames/elegant-frame.png' },
  { id: 'default-3', name: 'Party Vibes', category: 'fun', url: '/frames/party-vibes.png' },
  { id: 'default-4', name: 'Event Special', category: 'events', url: '/frames/event-special.png' },
  { id: 'default-5', name: 'Celebration', category: 'events', url: '/frames/celebration-frame.png' },
];

export const CATEGORIES = ['All Frames', 'Minimal', 'Events', 'Fun'];