import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Download, Upload, Loader2, RefreshCw } from 'lucide-react';
import { type Frame } from '../types';
import { uploadToImageKit } from '../services/imagekit';

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
  const [isUploading, setIsUploading] = useState(false);

  const drawCanvas = useCallback(async () => {
    setIsProcessing(true);
    try {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const userImage = new Image();
        userImage.crossOrigin = 'anonymous';

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
    a.download = `photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleShare = async () => {
    if (!compositedImage) return;

    setIsUploading(true);
    try {
      const fileName = `photo-${Date.now()}.jpg`;
      const result = await uploadToImageKit(compositedImage, fileName);
      
      if (navigator.share) {
        await navigator.share({
          title: 'My Photo',
          text: 'Check out this photo!',
          url: result.url,
        });
      } else {
        await navigator.clipboard.writeText(result.url);
        alert('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
       <header className="flex items-center justify-between p-4 bg-black/30 z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold">Preview & Share</h2>
        <button onClick={onStartOver} className="p-2 hover:bg-white/10 rounded-full">
            <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full flex items-center justify-center">
            <canvas ref={canvasRef} className="hidden" />
            {isProcessing && (
                <div className="w-full h-full flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-10 h-10 animate-spin" />
                </div>
            )}
            {compositedImage && !isProcessing && (
                <img src={compositedImage} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
            )}
            {!compositedImage && !isProcessing && (
                 <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gray-800">
                    <p>Error creating image.</p>
                </div>
            )}
        </div>
      </main>

      <footer className="p-4 bg-black/30">
        <div className="flex gap-4">
             <button
              onClick={handleDownload}
              disabled={isProcessing || isUploading || !compositedImage}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Download size={24} />
              Download
            </button>
            <button
              onClick={handleShare}
              disabled={isProcessing || isUploading || !compositedImage}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload size={24} />}
              Share
            </button>
        </div>
      </footer>
    </div>
  );
};

export default CameraPage;