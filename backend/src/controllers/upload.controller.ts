import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../utils/apiError.js';

const UPLOAD_FOLDER = 'hand-me-down/items';
const ALLOWED_FORMATS = 'jpg,png,webp';

export const getUploadSignature = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError('Photo uploads are not configured.', 503);
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: UPLOAD_FOLDER,
      allowed_formats: ALLOWED_FORMATS,
    },
    apiSecret,
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    success: true,
    data: {
      cloudName,
      apiKey,
      timestamp,
      folder: UPLOAD_FOLDER,
      allowedFormats: ALLOWED_FORMATS,
      signature,
    },
  });
};
