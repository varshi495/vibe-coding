import React from 'react';
import { Message } from '../../types/chat';
import { AudioPlayer } from './AudioPlayer';
import { FileText, Download, FileArchive, FileSpreadsheet } from 'lucide-react';

interface MediaMessageProps {
  message: Message;
  isMe: boolean;
  onOpenLightbox: (imageUrl: string, fileName?: string) => void;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({ message, isMe, onOpenLightbox }) => {
  // Resolve absolute URL for relative `/uploads/...` paths
  const getFullMediaUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const serverHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin;
    return `${serverHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const mediaUrl = getFullMediaUrl(message.mediaUrl);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderDocumentIcon = (fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'zip' || ext === 'rar' || ext === 'tar') {
      return <FileArchive className="w-6 h-6 text-amber-400" />;
    }
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    }
    return <FileText className="w-6 h-6 text-red-400" />;
  };

  switch (message.type) {
    case 'IMAGE':
      return (
        <div className="flex flex-col gap-1.5">
          <div
            onClick={() => onOpenLightbox(mediaUrl, message.fileName || 'image.png')}
            className="cursor-pointer overflow-hidden rounded-lg relative group bg-black/20"
          >
            <img
              src={mediaUrl}
              alt={message.fileName || 'Shared image'}
              className="max-h-72 max-w-full rounded-lg object-cover hover:scale-[1.02] transition-transform duration-200"
              loading="lazy"
            />
          </div>
          {message.content && message.content !== message.fileName && (
            <div className="text-sm text-[#e9edef] whitespace-pre-wrap break-words pr-14">
              {message.content}
            </div>
          )}
        </div>
      );

    case 'VIDEO':
      return (
        <div className="flex flex-col gap-1.5">
          <div className="overflow-hidden rounded-lg max-h-80 bg-black/40">
            <video
              src={mediaUrl}
              controls
              className="max-h-80 max-w-full rounded-lg object-contain"
            />
          </div>
          {message.content && message.content !== message.fileName && (
            <div className="text-sm text-[#e9edef] whitespace-pre-wrap break-words pr-14">
              {message.content}
            </div>
          )}
        </div>
      );

    case 'AUDIO':
      return (
        <div className="flex flex-col">
          <AudioPlayer src={mediaUrl} isSender={isMe} />
        </div>
      );

    case 'DOCUMENT':
      return (
        <div className="flex flex-col gap-1.5">
          <a
            href={mediaUrl}
            download={message.fileName || 'document'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 hover:bg-black/30 transition border border-[#222e35]/60 min-w-[220px] max-w-[280px]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#202c33] flex items-center justify-center flex-shrink-0">
              {renderDocumentIcon(message.fileName)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#e9edef] truncate block">
                {message.fileName || 'Document'}
              </span>
              <span className="text-[10px] text-[#8696a0] block uppercase">
                {formatFileSize(message.fileSize)} · {message.fileName?.split('.').pop() || 'FILE'}
              </span>
            </div>
            <div className="p-1.5 rounded-full hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef] transition flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
          </a>
          {message.content && message.content !== message.fileName && (
            <div className="text-sm text-[#e9edef] whitespace-pre-wrap break-words pr-14">
              {message.content}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="whitespace-pre-wrap break-words pr-14">{message.content}</div>
      );
  }
};

export default MediaMessage;
