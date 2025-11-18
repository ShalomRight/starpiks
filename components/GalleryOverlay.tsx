
import React, { useState } from 'react';
import { Camera, X, Check, Trash2, Download, Upload, Loader2 } from 'lucide-react';
import { type Photo } from '../types';
import { storage } from '../services/storage';
import { uploadToImageKit } from '../services/imagekit';

interface GalleryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
}

const GalleryOverlay: React.FC<GalleryOverlayProps> = ({ isOpen, onClose, photos, setPhotos }) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedPhotos([]);
    onClose();
  }

  const handleDelete = async () => {
    if (selectedPhotos.length === 0) return;
    if (!confirm(`Delete ${selectedPhotos.length} photo(s)?`)) return;

    await storage.deletePhotos(selectedPhotos);
    setPhotos(prev => prev.filter(p => !selectedPhotos.includes(p.id)));
    setSelectedPhotos([]);
  };

  const handleDownload = () => {
    selectedPhotos.forEach(id => {
      const photo = photos.find(p => p.id === id);
      if (photo) {
        const a = document.createElement('a');
        a.href = photo.dataUrl;
        a.download = `photo-${photo.timestamp}.jpg`;
        a.click();
      }
    });
  };
  
  const handleShare = async () => {
    if (selectedPhotos.length === 0) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    try {
      const selectedPhotoData = photos.filter(p => selectedPhotos.includes(p.id));
      
      for (let i = 0; i < selectedPhotoData.length; i++) {
        const photo = selectedPhotoData[i];
        setUploadProgress(`Uploading ${i + 1} of ${selectedPhotoData.length}...`);

        try {
          if (photo.imagekitUrl) {
            uploadedUrls.push(photo.imagekitUrl);
            continue;
          }

          const fileName = `photo-booth-${photo.timestamp}-${photo.id}.jpg`;
          const result = await uploadToImageKit(photo.dataUrl, fileName);
          
          const updatedPhoto = { ...photo, imagekitUrl: result.url, imagekitFileId: result.fileId };
          await storage.savePhoto(updatedPhoto);
          setPhotos(prev => prev.map(p => p.id === photo.id ? updatedPhoto : p));
          uploadedUrls.push(result.url);
        } catch (error) {
          errors.push(`Photo ${i + 1}`);
        }
      }

      setIsUploading(false);

      if (uploadedUrls.length > 0) {
        const message = `Check out my photo(s) from Photo Booth!\n\n${uploadedUrls.join('\n')}`;
        
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Photo Booth Photos', text: message });
          } catch (shareError) {
            if ((shareError as Error).name !== 'AbortError') console.error('Share error:', shareError);
          }
        } else {
            await navigator.clipboard.writeText(message);
            alert('Links copied to clipboard!');
        }
      }

      if (errors.length > 0) alert(`⚠️ Failed to upload: ${errors.join(', ')}`);

    } catch (error) {
      setIsUploading(false);
      alert('❌ Failed to upload photos. Please try again.');
    }
  };


  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-semibold">Gallery ({photos.length})</h3>
          <button onClick={handleClose} className="text-white p-2 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            <Camera className="w-16 h-16 mx-auto mb-4" />
            <p>No photos yet</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              {selectedPhotos.length === 0 ? (
                <button onClick={() => setSelectedPhotos(photos.map(p => p.id))} className="text-sm text-blue-400 font-medium">Select All</button>
              ) : (
                <>
                  <button onClick={() => setSelectedPhotos([])} className="text-sm text-white/60 font-medium">Deselect All</button>
                  <span className="text-sm text-white/60">({selectedPhotos.length} selected)</span>
                </>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {[...photos].reverse().map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotos(prev => prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id])}
                  className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden"
                >
                  <img src={photo.thumbnail} alt="Photo" className="w-full h-full object-cover" />
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedPhotos.includes(photo.id) ? 'bg-blue-500 border-blue-500' : 'bg-black/40 border-white'}`}>
                    {selectedPhotos.includes(photo.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <div className="p-4 bg-black border-t border-white/10">
          {isUploading && (
            <div className="mb-3 p-3 bg-blue-500/20 rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm text-blue-400">{uploadProgress}</span>
            </div>
          )}

          <div className="flex gap-3 mb-3">
            <button onClick={handleShare} disabled={selectedPhotos.length === 0 || isUploading} className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2">
              {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5" /> Share ({selectedPhotos.length})</>}
            </button>
            <button onClick={handleDownload} disabled={selectedPhotos.length === 0 || isUploading} className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Download
            </button>
          </div>

          {selectedPhotos.length > 0 && !isUploading && (
            <button onClick={handleDelete} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold py-3 rounded-full transition-all flex items-center justify-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Selected
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default GalleryOverlay;
