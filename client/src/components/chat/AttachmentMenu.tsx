import React, { useRef, useEffect } from 'react';
import { Image, FileText, Camera } from 'lucide-react';

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => void;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({ isOpen, onClose, onSelectFile }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onClose();
    }
    e.target.value = '';
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onClose();
    }
    e.target.value = '';
  };

  return (
    <div
      ref={menuRef}
      className="absolute bottom-16 left-6 z-40 bg-[#233138] border border-[#2a3942] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1 w-52 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md"
    >
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={mediaInputRef}
        onChange={handleMediaChange}
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocChange}
        accept=".pdf,.doc,.docx,.txt,.zip,.xlsx,.xls,application/pdf,text/plain"
        className="hidden"
      />

      <button
        type="button"
        onClick={() => mediaInputRef.current?.click()}
        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[#111b21] transition text-left group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
          <Image className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#e9edef]">Photos & Videos</span>
          <span className="text-[11px] text-[#8696a0]">Images or clips</span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => docInputRef.current?.click()}
        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[#111b21] transition text-left group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#e9edef]">Document</span>
          <span className="text-[11px] text-[#8696a0]">PDF, Word, or ZIP</span>
        </div>
      </button>
    </div>
  );
};

export default AttachmentMenu;
