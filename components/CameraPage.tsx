import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, FlipHorizontal, Image as ImageIcon, Zap, Loader2 } from 'lucide-react';
import { type Frame, type Photo } from '../types';
import { storage } from '../services/storage';
import GalleryOverlay from './GalleryOverlay';

interface CameraPageProps { 
  selectedFrame: Frame; 
  onBack: () => void;
}

const CameraPage: React.FC<CameraPageProps> = ({ selectedFrame, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  const startCamera = useCallback(async (currentFacingMode: 'user' | 'environment') => {
    stopCamera();
    setCameraError(null);
    setIsCameraReady(false);
    
    const constraints: MediaStreamConstraints = {
      video: { 
        facingMode: { ideal: currentFacingMode }, 
        width: { ideal: 1920 }, 
        height: { ideal: 1080 } 
      }
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Camera error:', err);
      const fallbackConstraints: MediaStreamConstraints = { video: { facingMode: currentFacingMode } };
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (fallbackErr) {
          console.error('Fallback camera error:', fallbackErr);
          let message = 'Failed to access camera. Please enable permissions and ensure your camera is not in use.';
          if (fallbackErr instanceof DOMException) {
              if (fallbackErr.name === 'NotFoundError' || fallbackErr.name === 'DevicesNotFoundError') {
                  message = `Could not find a camera for '${currentFacingMode}' mode. Try switching cameras.`;
              } else if (fallbackErr.name === 'NotAllowedError' || fallbackErr.name === 'PermissionDeniedError') {
                  message = 'Camera access denied. Please enable camera permissions in your browser settings.';
              }
          }
          setCameraError(message);
      }
    }
  }, [stopCamera]);


  useEffect(() => {
    const loadPhotos = async () => {
      const stored = await storage.getPhotos();
      setPhotos(stored.reverse()); // Show newest first
    };
    loadPhotos();
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera();
  }, [facingMode, startCamera, stopCamera]);

  const handleVideoReady = async () => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      try {
        await videoRef.current.play();
        setIsCameraReady(true);
      } catch (error) {
        console.error("Error playing video:", error);
        setIsCameraReady(false);
      }
    }
  };

  const capturePhoto = async () => {
    if (!isCameraReady || !videoRef.current || !canvasRef.current) {
      console.error("Camera not ready or refs not available.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    const videoRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = canvas.width / canvas.height;
    let sx, sy, sWidth, sHeight;

    if (videoRatio > canvasRatio) {
        sHeight = video.videoHeight;
        sWidth = sHeight * canvasRatio;
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
    } else {
        sWidth = video.videoWidth;
        sHeight = sWidth / canvasRatio;
        sy = (video.videoHeight - sHeight) / 2;
        sx = 0;
    }
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    const frameImg = new window.Image();
    frameImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      frameImg.onload = resolve;
      frameImg.onerror = reject;
      frameImg.src = selectedFrame.url;
    });

    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 200;
    thumbCanvas.height = 200;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, 200, 200);
    }
    const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.8);

    const photo: Photo = {
      id: crypto.randomUUID(),
      dataUrl,
      thumbnail,
      timestamp: Date.now(),
      frameId: selectedFrame.id
    };

    await storage.savePhoto(photo);
    setPhotos(prev => [photo, ...prev]);
    
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;inset:0;background:white;z-index:9999;animation:flash 0.3s ease-out';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  };

  const handleGoBack = () => {
    stopCamera();
    onBack();
  }

  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedData={handleVideoReady}
        playsInline
        muted
        autoPlay
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <img 
          src={selectedFrame.url} 
          alt="Frame" 
          className="w-full h-full object-cover"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {cameraError && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-20">
          <X className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl text-white font-bold mb-2">Camera Error</h2>
          <p className="text-white/80">{cameraError}</p>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button
          onClick={handleGoBack}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFlashEnabled(!flashEnabled)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              flashEnabled ? 'bg-yellow-500' : 'bg-white/20 backdrop-blur-sm'
            }`}
          >
            <Zap className={`w-5 h-5 ${flashEnabled ? 'text-white' : 'text-white'}`} />
          </button>
          
          <button
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <FlipHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setGalleryOpen(true)}
            className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/30 transition-all"
          >
            {photos.length > 0 ? (
              <>
                <img src={photos[0].thumbnail} alt="Last" className="w-full h-full object-cover" />
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {photos.length}
                </div>
              </>
            ) : (
              <ImageIcon className="w-6 h-6 text-white absolute inset-0 m-auto" />
            )}
          </button>

          <button
            onClick={capturePhoto}
            disabled={!isCameraReady || !!cameraError}
            className="w-20 h-20 bg-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isCameraReady ? 
              (<Loader2 className="w-10 h-10 text-black animate-spin" />) :
              (<div className="w-16 h-16 border-4 border-black rounded-full" />)
            }
          </button>
          <div className="w-14 h-14" />
        </div>
      </div>

      <GalleryOverlay 
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={photos}
        setPhotos={setPhotos}
      />

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default CameraPage;