import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, FlipHorizontal, Zap, Loader2, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import { type Frame, type Photo } from '../types';
import { storage } from '../services/storage';
import GalleryOverlay from './GalleryOverlay';
import ImageIcon from 'lucide-react/dist/esm/icons/image';

interface CameraPageProps { 
  selectedFrame: Frame; 
  onBack: () => void;
}

const CameraPage: React.FC<CameraPageProps> = ({ selectedFrame, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Gallery State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Photo Capture State
  const [capturedPhoto, setCapturedPhoto] = useState<Photo | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Camera Status State
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permission, setPermission] = useState('prompt');

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleCameraError = (err: Error) => {
    console.error('Camera error:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      setPermission('denied');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      setCameraError('No camera found on this device. Try switching camera modes.');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      setCameraError('Camera is already in use by another application.');
    } else if (err.name === 'OverconstrainedError') {
      setCameraError('Could not satisfy camera requirements.');
    } else {
      setCameraError(`An unexpected camera error occurred: ${err.message}`);
    }
  };

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setStream(mediaStream);
      setPermission('granted');
    } catch (err) {
      handleCameraError(err as Error);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    const loadPhotos = async () => {
      const stored = await storage.getPhotos();
      setPhotos(stored.reverse());
    };
    loadPhotos();
    startCamera();
    return () => stopCamera();
  }, [facingMode, startCamera, stopCamera]);


  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setIsCapturing(false);
        return;
    }

    // Set canvas to desired output dimensions
    canvas.width = 1080;
    canvas.height = 1920;

    // Calculate cropping to maintain aspect ratio (cover)
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

    // Draw cropped video to canvas
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    // Overlay the selected frame
    const frameImg = new window.Image();
    frameImg.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      frameImg.onload = resolve;
      frameImg.onerror = () => resolve(null); // Continue even if frame fails
      frameImg.src = selectedFrame.url;
    });
    ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

    // Create data URL and thumbnail
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 200;
    thumbCanvas.height = 200;
    thumbCanvas.getContext('2d')?.drawImage(canvas, 0, 0, 200, 200);
    const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.8);
    
    const photo: Photo = {
      id: crypto.randomUUID(),
      dataUrl,
      thumbnail,
      timestamp: Date.now(),
      frameId: selectedFrame.id
    };

    setCapturedPhoto(photo);
    setIsCapturing(false);
  };
  
  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;
    await storage.savePhoto(capturedPhoto);
    setPhotos(prev => [capturedPhoto, ...prev]);
    setCapturedPhoto(null);
  };

  const handleGoBack = () => {
    stopCamera();
    onBack();
  }

  // Preview screen after photo is taken
  if (capturedPhoto) {
    return (
      <div className="fixed inset-0 bg-black">
        <img src={capturedPhoto.dataUrl} alt="Captured" className="w-full h-full object-contain" />
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
            <button
                onClick={retakePhoto}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
            >
                <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-white font-semibold text-lg">Preview</h2>
            <div className="w-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-around gap-4">
            <button
              onClick={retakePhoto}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white py-4 rounded-2xl font-semibold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
            >
              <Camera size={24} />
              Retake
            </button>
            <button
              onClick={savePhoto}
              className="flex-1 bg-white text-black py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <Check size={24} />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main camera view
  return (
    <div className="fixed inset-0 bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
      <div className="absolute inset-0 pointer-events-none">
        <img src={selectedFrame.url} alt="Frame" className="w-full h-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {cameraError && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 z-20">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl text-white font-bold mb-2">Camera Error</h2>
            <p className="text-white/80 mb-6">{cameraError}</p>
            <button
                onClick={startCamera}
                className="bg-white/20 text-white py-2 px-4 rounded-lg"
            >
                Try Again
            </button>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={handleGoBack} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30">
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
            <Zap className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30">
            <FlipHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-around">
          <button onClick={() => setGalleryOpen(true)} className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/30">
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
          <button onClick={capturePhoto} disabled={isCapturing || !!cameraError} className="w-20 h-20 bg-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center disabled:opacity-50">
            {isCapturing ? <Loader2 className="w-10 h-10 text-black animate-spin" /> : <div className="w-16 h-16 border-4 border-black rounded-full" />}
          </button>
          <div className="w-14 h-14" />
        </div>
      </div>

      <GalleryOverlay isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} photos={photos} setPhotos={setPhotos} />
    </div>
  );
}

export default CameraPage;
