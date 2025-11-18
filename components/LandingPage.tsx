import React, { useState } from 'react';
import { UploadCloud, Loader2, Camera } from 'lucide-react';

interface LandingPageProps {
  onImageSelect: (image: string) => void;
  onTakePicture: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onImageSelect, onTakePicture }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
    }

    setIsLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
        if (e.target?.result) {
            onImageSelect(e.target.result as string);
        } else {
            setError('Could not read the image.');
        }
        setIsLoading(false);
    };
    reader.onerror = () => {
        setError('Error reading file.');
        setIsLoading(false);
    }
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Photo Frame Studio
        </h1>
        <p className="text-gray-600 mb-8">
          Add a beautiful frame to your photo
        </p>
        
        <div className="space-y-4">
            <label htmlFor="image-upload" className="w-full cursor-pointer bg-black text-white font-semibold py-4 px-6 rounded-full hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  Select a Photo
                </>
              )}
            </label>
            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isLoading} />
            
            <button 
              onClick={onTakePicture} 
              className="w-full cursor-pointer bg-white text-black border border-gray-300 font-semibold py-4 px-6 rounded-full hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Camera className="w-5 h-5" />
              Take a Picture
            </button>
        </div>
        
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span className="font-bold">🖼️</span> Frame your memories
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-4">Version 2</p>
      </div>
    </div>
  );
}

export default LandingPage;