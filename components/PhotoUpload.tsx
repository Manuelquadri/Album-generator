import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface PhotoUploadProps {
  onUpload: (files: FileList | null) => void;
  photoCount: number;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUpload, photoCount }) => {
  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <label 
        htmlFor="photo-upload" 
        className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-12 h-12 mb-4 text-gray-400" />
          <p className="mb-2 text-xl text-gray-500 font-semibold">Click para subir tus recuerdos</p>
          <p className="text-sm text-gray-400">JPG, PNG (Max 10MB)</p>
          {photoCount > 0 && (
            <div className="mt-4 px-4 py-2 bg-brand-blue/10 text-brand-dark rounded-full text-sm font-medium flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              {photoCount} fotos seleccionadas
            </div>
          )}
        </div>
        <input 
          id="photo-upload" 
          type="file" 
          className="hidden" 
          multiple 
          accept="image/*"
          onChange={(e) => onUpload(e.target.files)}
        />
      </label>
    </div>
  );
};