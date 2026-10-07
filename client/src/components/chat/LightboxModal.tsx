import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  fileName = 'image.png',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 select-none"
    >
      {/* Top action bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between text-[#e9edef] h-12 px-2"
      >
        <span className="text-sm font-medium truncate max-w-xs sm:max-w-md">{fileName}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 text-[#e9edef] transition"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#e9edef] transition"
            title="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Centered Image */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={fileName}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-transform"
        />
      </div>

      {/* Bottom spacer */}
      <div className="h-6" />
    </div>
  );
};

export default LightboxModal;
