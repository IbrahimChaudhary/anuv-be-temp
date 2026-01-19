import { Request, Response } from 'express';
import { uploadToCloudinary } from '../config/cloudinary';
import { ApiResponse } from '../types/responseTypes';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("i am in lcoud")
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const folder = (req.body.folder as string) || 'playlists';

    const result = await uploadToCloudinary(req.file.buffer, folder);

    const response: ApiResponse<{ url: string; public_id: string }> = {
      success: true,
      data: {
        url: result.url,
        public_id: result.public_id
      }
    };
    console.log("uploaded", response)
    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
