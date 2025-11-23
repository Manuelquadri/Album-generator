import React, { useState } from 'react';
import { Photo } from '../types';
import { ImageCropper } from './ImageCropper';
import { AlertCircle, CheckCircle2, Crop, Wand2, Loader2, RefreshCw } from 'lucide-react';
import { autoCropImage } from '../utils/imageUtils';

interface PhotoStandardizerProps {
  photos: Photo[];
  onUpdatePhoto: (id: string, newUrl: string) => void;
  onUpdatePhotos: (updates: { id: string; url: string }[]) => void;
  onComplete: () => void;
}

export const PhotoStandardizer: React.FC<PhotoStandardizerProps> = ({ 
  photos, 
  onUpdatePhoto, 
  onUpdatePhotos,
  onComplete 
}) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);

  const handleCropConfirm = (newUrl: string) => {
    if (selectedPhotoId) {
      onUpdatePhoto(selectedPhotoId, newUrl);
      setSelectedPhotoId(null);
    }
  };

  const handleAutoStandardize = async () => {
    setIsAutoProcessing(true);
    try {
      // Process all photos in parallel
      const updatePromises = photos.map(async (photo) => {
        // We always use originalUrl to prevent degrading quality on multiple passes
        const newUrl = await autoCropImage(photo.originalUrl);
        return { id: photo.id, url: newUrl };
      });

      const updates = await Promise.all(updatePromises);
      onUpdatePhotos(updates);
    } catch (error) {
      console.error("Auto standardize failed", error);
      alert("Hubo un error al procesar algunas imágenes.");
    } finally {
      setIsAutoProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      {selectedPhoto && (
        <ImageCropper 
          imageSrc={selectedPhoto.originalUrl}
          onConfirm={handleCropConfirm}
          onCancel={() => setSelectedPhotoId(null)}
        />
      )}

      <div className="text-center mb-10 space-y-4">
        <h2 className="text-4xl font-serif font-bold text-gray-900">Perfecciona tus Fotos</h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">
          Para un álbum profesional, las imágenes deben tener formatos consistentes.
          <br />Usa la herramienta automática o ajusta manualmente.
        </p>

        <button
          onClick={handleAutoStandardize}
          disabled={isAutoProcessing}
          className={`
            mx-auto px-6 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105
            flex items-center space-x-2
            ${isAutoProcessing ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-indigo-500/30'}
          `}
        >
          {isAutoProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Procesando {photos.length} fotos...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Estandarizar Automáticamente</span>
            </>
          )}
        </button>
        {isAutoProcessing && (
          <p className="text-xs text-gray-400 mt-2">Esto puede tomar unos segundos...</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 relative">
              <img 
                src={photo.url} 
                alt="Upload" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              
              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 backdrop-blur-[2px]">
                <button 
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className="bg-white text-brand-dark px-4 py-2 rounded-full text-sm font-bold flex items-center hover:bg-brand-pink hover:text-white transition-colors"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <div className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded">
                  {/* Visual indicator of manual edit possibility */}
                  Click para ajustar
                </div>
              </div>

              {/* Status Badge (simulated logic for 'standardized' - simply checking if it differs from original URL in a real app would be complex without tracking state, but here we assume if they clicked auto it's good) */}
              {photo.url !== photo.originalUrl && (
                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg z-10">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center border-t border-gray-200 pt-8">
        <button
          onClick={onComplete}
          className="px-10 py-4 bg-gray-900 text-white rounded-full font-bold text-lg shadow-xl hover:bg-gray-800 hover:shadow-2xl transition-all flex items-center group"
        >
          <span>Continuar al Diseño</span>
          <CheckCircle2 className="w-6 h-6 ml-3 group-hover:text-brand-pink transition-colors" />
        </button>
      </div>
    </div>
  );
};