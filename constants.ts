
import { type Frame } from './types';

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: "dac3tqyuj",
  // This is a DEMO preset from the Cloudinary documentation example.
  // It allows the upload to succeed but creates a restricted image that cannot be shared.
  //
  // IMPORTANT: For the "Share" feature to work, you MUST create your own
  // UNSIGNED upload preset in your Cloudinary dashboard and replace the value below.
  // Go to: Settings > Upload > Upload Presets > Add Upload Preset (set Signing Mode to "Unsigned").
  uploadPreset: "starpic"
};

// Frame data - these PNG files should be in public/frames/
export const FRAMES: Frame[] = [
  { id: 'default-1', name: 'Classic Border', category: 'minimal', url: 'public/frames/default-1.png' },
  { id: 'default-2', name: 'Elegant Frame', category: 'minimal', url: 'public/frames/default-2.png' },
  { id: 'default-3', name: 'Party Vibes', category: 'fun', url: '/frames/default-3.png' },
  { id: 'default-4', name: 'Event Special', category: 'events', url: '/frames/default-4.png' },
  { id: 'default-5', name: 'Celebration', category: 'events', url: '/frames/default-5.png' },
];

export const CATEGORIES = ['All Frames', 'Minimal', 'Events', 'Fun'];