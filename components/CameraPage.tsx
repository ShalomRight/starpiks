
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Download, Upload, Loader2, RefreshCw } from 'lucide-react';
import { type Frame } from '../types';
import { uploadToCloudinary } from '../services/cloudinary';

interface CameraPageProps {
  imageSrc: string;
  frame: Frame | null;
  onBack: () => void;
  onStartOver: () => void;
}

const CameraPage: React.FC<CameraPageProps> = ({ imageSrc, frame, onBack, onStartOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [compositedImage, setCompositedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);


  const drawCanvas = useCallback(async () => {
    setIsProcessing(true);
    try {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const userImage = new Image();

        const userImagePromise = new Promise<void>((resolve, reject) => {
            userImage.onload = () => resolve();
            userImage.onerror = reject;
            userImage.src = imageSrc;
        });

        await userImagePromise;

        if (frame) {
            const frameImage = new Image();
            frameImage.crossOrigin = 'anonymous';
            const frameImagePromise = new Promise<void>((resolve, reject) => {
                frameImage.onload = () => resolve();
                frameImage.onerror = reject;
                frameImage.src = frame.url;
            });
            await frameImagePromise;

            const frameAspectRatio = (frameImage.width > 0 && frameImage.height > 0) ? frameImage.width / frameImage.height : 9 / 16;
            canvas.width = 1080;
            canvas.height = 1080 / frameAspectRatio;
            
            const userImageRatio = userImage.width / userImage.height;
            const canvasRatio = canvas.width / canvas.height;
            let sx, sy, sWidth, sHeight;

            if (userImageRatio > canvasRatio) {
                sHeight = userImage.height;
                sWidth = sHeight * canvasRatio;
                sx = (userImage.width - sWidth) / 2;
                sy = 0;
            } else {
                sWidth = userImage.width;
                sHeight = sWidth / canvasRatio;
                sy = (userImage.height - sHeight) / 2;
                sx = 0;
            }

            ctx.drawImage(userImage, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
        } else {
            const aspectRatio = userImage.width / userImage.height;
            const MAX_DIMENSION = 1920;
            if (userImage.width > userImage.height) {
                canvas.width = Math.min(userImage.width, MAX_DIMENSION);
                canvas.height = canvas.width / aspectRatio;
            } else {
                canvas.height = Math.min(userImage.height, MAX_DIMENSION);
                canvas.width = canvas.height * aspectRatio;
            }
            ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
        }

        setCompositedImage(canvas.toDataURL('image/jpeg', 0.9));
    } catch (error) {
        console.error("Error loading images for canvas", error);
    } finally {
        setIsProcessing(false);
    }
  }, [imageSrc, frame]);
  
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    if (!compositedImage) return;
    const a = document.createElement('a');
    a.href = compositedImage;
    a.download = `photo-frame-studio-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleShare = async () => {
    if (!compositedImage || isSharing) return;
    setIsSharing(true);
    setShareError(null);

    try {
      const uploadedUrl = await uploadToCloudinary(compositedImage);
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Photo Frame',
          text: 'Check out the photo I framed!',
          url: uploadedUrl,
        });
      } else {
        navigator.clipboard.writeText(uploadedUrl);
        alert('Share URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      if (error instanceof Error) {
        setShareError(`Share failed: ${error.message}. Please check your Cloudinary config.`);
      } else {
        setShareError('An unknown error occurred during sharing.');
      }
    } finally {
      setIsSharing(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 text-gray-800 flex flex-col">
       <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Preview & Share</h2>
        <button onClick={onStartOver} className="p-2 hover:bg-gray-200 rounded-full">
            <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full flex items-center justify-center">
            <canvas ref={canvasRef} className="hidden" />
            {isProcessing && (
                <div className="w-full h-full flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                </div>
            )}
            {compositedImage && !isProcessing && (
                <img src={compositedImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg" />
            )}
            {!compositedImage && !isProcessing && (
                 <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gray-200">
                    <p>Error creating image.</p>
                </div>
            )}
        </div>
      </main>

      <footer className="p-4 bg-white/80 backdrop-blur-lg border-t border-gray-200 z-10">
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
             <button
              onClick={handleDownload}
              disabled={isProcessing || !compositedImage}
              className="w-full cursor-pointer bg-white text-black border border-gray-300 font-semibold py-4 px-6 rounded-full hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={handleShare}
              disabled={isProcessing || !compositedImage || isSharing}
              className="w-full cursor-pointer bg-black text-white font-semibold py-4 px-6 rounded-full hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
        </div>
        {shareError && <p className="text-red-600 text-center text-sm mt-3">{shareError}</p>}
      </footer>
    </div>
  );
};

export default CameraPage;
