import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Move, Loader2 } from 'lucide-react';
import { getCroppedImg, createImage } from '../utils/imageUtils';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
}

const ASPECT_RATIOS = [
  { label: '3:4 (Retrato)', value: 3/4 },
  { label: '1:1 (Cuadrado)', value: 1 },
  { label: '4:3 (Paisaje)', value: 4/3 },
];

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [aspectRatio, setAspectRatio] = useState(3/4);
  const [offset, setOffset] = useState({ x: 50, y: 50 }); // Percentage 0-100
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // We use this to calculate limits
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    // Preload image to get dimensions
    createImage(imageSrc).then((img) => {
      setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      
      // Auto-set aspect ratio based on orientation
      if (img.naturalWidth > img.naturalHeight) {
        setAspectRatio(4/3);
      } else {
        setAspectRatio(3/4);
      }
      setImageLoaded(true);
    });
  }, [imageSrc]);

  const handleCrop = async () => {
    if (!imageLoaded) return;
    setIsProcessing(true);
    try {
      const { w, h } = imgDimensions;
      
      // Calculate crop dimensions based on aspect ratio
      let cropWidth, cropHeight;
      const imgRatio = w / h;

      if (imgRatio > aspectRatio) {
        // Image is wider than target -> Height is limiting factor
        cropHeight = h;
        cropWidth = cropHeight * aspectRatio;
      } else {
        // Image is taller than target -> Width is limiting factor
        cropWidth = w;
        cropHeight = cropWidth / aspectRatio;
      }

      // Calculate position based on offset percentage
      const maxOffsetX = w - cropWidth;
      const maxOffsetY = h - cropHeight;
      
      const startX = (offset.x / 100) * maxOffsetX;
      const startY = (offset.y / 100) * maxOffsetY;

      const croppedUrl = await getCroppedImg(imageSrc, {
        x: startX,
        y: startY,
        width: cropWidth,
        height: cropHeight
      });

      onConfirm(croppedUrl);
    } catch (e) {
      console.error("Crop failed", e);
      alert("Error al recortar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row h-[80vh] shadow-2xl">
        
        {/* Preview Area */}
        <div className="flex-1 bg-stone-100 relative overflow-hidden flex items-center justify-center p-4">
          {!imageLoaded ? (
            <div className="flex flex-col items-center text-gray-400">
               <Loader2 className="w-8 h-8 animate-spin mb-2" />
               <span className="text-sm">Cargando imagen...</span>
            </div>
          ) : (
            <div className="relative shadow-2xl transition-all duration-300">
              {/* The Image */}
              <img 
                src={imageSrc} 
                alt="Crop target" 
                className="max-h-[60vh] md:max-h-full object-contain pointer-events-none select-none" 
              />
              
              {/* Overlay logic: 
                  Since we don't have a full interactive cropper library, 
                  we visualize the crop via the sliders. 
                  In a real pro app, we'd use react-easy-crop.
              */}
              <div className="absolute inset-0 border-2 border-brand-pink/50 pointer-events-none flex items-center justify-center">
                 <div className="bg-black/40 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center backdrop-blur-sm">
                    <Move className="w-3 h-3 mr-1" /> Mueve los controles para ajustar
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="w-full md:w-80 bg-white p-6 border-l border-gray-200 flex flex-col justify-between overflow-y-auto z-10">
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-xl text-gray-800">Recortar Imagen</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Formato</label>
              <div className="grid grid-cols-1 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`px-3 py-2 text-sm rounded-lg border flex justify-between items-center transition-all ${
                      Math.abs(aspectRatio - ratio.value) < 0.01
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{ratio.label}</span>
                    {Math.abs(aspectRatio - ratio.value) < 0.01 && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ajuste Horizontal</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={offset.x} 
                onChange={(e) => setOffset(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-pink"
              />
            </div>

             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ajuste Vertical</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={offset.y} 
                onChange={(e) => setOffset(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-pink"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-8 pt-4 border-t border-gray-100">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCrop}
              disabled={isProcessing || !imageLoaded}
              className="flex-1 py-3 px-4 bg-brand-pink text-white rounded-lg font-medium hover:bg-[#ff7a91] transition-all flex justify-center items-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Aplicar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};