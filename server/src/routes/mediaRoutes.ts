import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { handleFileUpload } from '../middleware/uploadMiddleware';
import { uploadMedia } from '../controllers/mediaController';

const router = Router();

router.use(authenticateToken);

router.post('/upload', handleFileUpload, uploadMedia);

export default router;
