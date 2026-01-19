import { Router, Request, Response, NextFunction } from 'express';
import { getPlaylist, getRandomPlaylist, getAllPlaylists, createPlaylist, updatePlaylist, deletePlaylist } from '../controllers/playlistController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { upload } from '../config/cloudinary';
import multer from 'multer';

const router = Router();

router.get('/', authenticateAdmin, getAllPlaylists);

router.get('/random', getRandomPlaylist);

router.get('/:id', authenticateAdmin, getPlaylist);

router.post('/', authenticateAdmin, upload.single('image'),  createPlaylist);

router.put('/:id', authenticateAdmin, upload.single('image'),  updatePlaylist);

router.delete('/:id', authenticateAdmin, deletePlaylist);

export default router;
