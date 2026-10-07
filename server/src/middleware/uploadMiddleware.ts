import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export type AllowedCategory = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export function getMessageTypeFromMime(mimeType: string): AllowedCategory | null {
  if (mimeType.startsWith('image/')) {
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    return allowedImages.includes(mimeType) ? 'IMAGE' : null;
  }
  if (mimeType.startsWith('video/')) {
    const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    return allowedVideos.includes(mimeType) ? 'VIDEO' : null;
  }
  if (mimeType.startsWith('audio/')) {
    const allowedAudios = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac'];
    return allowedAudios.includes(mimeType) ? 'AUDIO' : null;
  }
  const allowedDocs = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (allowedDocs.includes(mimeType)) {
    return 'DOCUMENT';
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const randomHex = crypto.randomBytes(6).toString('hex');
    cb(null, `${Date.now()}-${randomHex}-${safeName}${ext}`);
  },
});

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const category = getMessageTypeFromMime(file.mimetype);
    if (!category) {
      return cb(new Error(`Disallowed file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
}).single('file');

export const handleFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File size exceeds 25MB limit' });
        return;
      }
      res.status(400).json({ error: err.message || 'File upload failed' });
      return;
    }
    next();
  });
};
