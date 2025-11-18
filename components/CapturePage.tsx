import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';

interface CapturePageProps {
  onPhotoTaken: (image: string) => void;
  onBack: () => void;
}

const CapturePage: React.FC<CapturePageProps> = ({ onPhotoTaken, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    const startCamera = async (mode: 'user' | 'environment') => {
      setIsInitializing(true);
      setError(null);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
  
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          setStream(newStream);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions.");
        setIsInitializing(false);
      }
    };

    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onPhotoTaken(dataUrl);
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between p-4 bg-black/30 z-10 absolute top-0 left-0 right-0">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold">Take a Photo</h2>
        <button onClick={handleSwitchCamera} disabled={isInitializing} className="p-2 hover:bg-white/10 rounded-full">
          <RefreshCw className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center relative">
        {isInitializing && <Loader2 className="w-10 h-10 animate-spin" />}
        {error && <p className="text-red-400 p-4 text-center">{error}</p>}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover ${isInitializing || error ? 'hidden' : ''}`}
          onLoadedData={() => setIsInitializing(false)}
        />
        <canvas ref={canvasRef} className="hidden" />
      </main>

      <footer className="p-6 bg-black/30 z-10 flex items-center justify-center">
        <button
          onClick={handleCapture}
          disabled={isInitializing || !!error}
          aria-label="Take Photo"
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-gray-400 disabled:opacity-50 transition active:scale-95"
        >
            <div className="w-16 h-16 rounded-full bg-white ring-2 ring-inset ring-black"></div>
        </button>
      </footer>
    </div>
  );
};

export default CapturePage;