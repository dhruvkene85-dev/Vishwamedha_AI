import React from 'react';
import { X, Download } from 'lucide-react';
import { MessageImage } from '../types';

interface ImageModalProps {
  image: MessageImage | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ image, onClose }) => {
  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name || 'study-diagram.png';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-4xl max-h-[92dvh] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <span className="text-xs font-bold text-slate-800 truncate max-w-md">
            {image.name || "Study Image / Diagram"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-download-modal-image"
              onClick={handleDownload}
              className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 transition cursor-pointer"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              id="btn-close-modal-image"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="p-4 sm:p-6 flex items-center justify-center overflow-auto flex-1 min-h-0 bg-slate-100/50">
          <img
            src={image.data}
            alt={image.name || "Diagram"}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-md border border-slate-200"
          />
        </div>
      </div>
    </div>
  );
};
