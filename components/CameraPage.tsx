import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, FlipHorizontal, Image, Download, Zap } from 'lucide-react';
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

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Failed to access camera. Please enable camera permissions.');
    }
  }, [facingMode, stopCamera]);


  useEffect(() => {
    const loadPhotos = async () => {
      const stored = await storage.getPhotos();
      setPhotos(stored);
    };
    loadPhotos();
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Camera is not ready, video has no dimensions.");
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    // Implement 'object-cover' logic to crop the video frame instead of stretching it.
    const videoRatio = video.videoWidth / video.videoHeight;
    const canvasRatio = canvas.width / canvas.height;
    let sx, sy, sWidth, sHeight;

    if (videoRatio > canvasRatio) { // video is wider than canvas, crop sides
        sHeight = video.videoHeight;
        sWidth = sHeight * canvasRatio;
        sx = (video.videoWidth - sWidth) / 2;
        sy = 0;
    } else { // video is taller or same ratio, crop top/bottom
        sWidth = video.videoWidth;
        sHeight = sWidth / canvasRatio;
        sy = (video.videoHeight - sHeight) / 2;
        sx = 0;
    }
    // Draw the cropped portion of the video onto the canvas
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    // FIX: Use window.Image to avoid conflict with the Image component from lucide-react.
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
    setPhotos(prev => [...prev, photo]);
    
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
        playsInline
        muted
      />
      
      <div className="absolute inset-0 pointer-events-none">
        <img 
          src={selectedFrame.url} 
          alt="Frame" 
          className="w-full h-full object-cover"
        />
      </div>

      <canvas ref={canvasRef} className="hidden" />

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
                <img src={photos[photos.length - 1].thumbnail} alt="Last" className="w-full h-full object-cover" />
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {photos.length}
                </div>
              </>
            ) : (
              <Image className="w-6 h-6 text-white absolute inset-0 m-auto" />
            )}
          </button>

          <button
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center"
          >
            <div className="w-16 h-16 border-4 border-black rounded-full" />
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