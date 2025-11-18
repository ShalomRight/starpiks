
import React from 'react';
import { Camera, Share2, Download } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Photo Booth
        </h1>
        <p className="text-gray-600 mb-8">
          Capture memories with beautiful frames
        </p>
        
        <button
          onClick={onStart}
          className="w-full bg-black text-white font-semibold py-4 px-6 rounded-full hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 mb-6"
        >
          <Camera className="w-5 h-5" />
          Take a Photo
        </button>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Professional frames</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            <span>Instant sharing</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            <span>Save locally</span>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span className="font-bold">⚡</span> PWA Photo Booth
          </p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
