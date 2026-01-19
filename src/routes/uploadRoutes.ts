import { Router, Request, Response, NextFunction } from 'express';
import { uploadImage } from '../controllers/uploadController';
import { upload } from '../config/cloudinary';
import { authenticateAdmin } from '../middleware/authMiddleware';
import multer from 'multer';

const router = Router();

const multerErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
 
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  next(err);
};

router.post('/image', authenticateAdmin, upload.single('image'), multerErrorHandler, uploadImage);

export default router;
