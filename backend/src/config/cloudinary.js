import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { config } from './environment.js';

// Configure Cloudinary if credentials are provided
if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  console.log('[Cloudinary] Configured with cloud name:', config.cloudinary.cloudName);
} else {
  console.log('[Cloudinary] Credentials not set. Operating with local disk storage fallback.');
}

/**
 * Uploads a file (from multer disk storage) to Cloudinary or keeps it in local storage
 */
export const uploadFile = async (localFilePath, originalName, mimeType) => {
  if (config.cloudinary.isConfigured) {
    try {
      const isPdf = mimeType === 'application/pdf';
      const result = await cloudinary.uploader.upload(localFilePath, {
        folder: 'veterans_portal/documents',
        resource_type: isPdf ? 'raw' : 'auto',
        use_filename: true,
        unique_filename: true,
      });

      // Clean up temporary local file after successful upload to Cloudinary
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return {
        fileUrl: result.secure_url || result.url,
        publicId: result.public_id,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('[Cloudinary Upload Error]', error.message);
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  // Fallback: Use local file URL served via Express static route
  const fileName = path.basename(localFilePath);
  const fileUrl = `/uploads/documents/${fileName}`;
  const stats = fs.statSync(localFilePath);

  return {
    fileUrl,
    publicId: fileName,
    bytes: stats.size,
  };
};

/**
 * Deletes a file from Cloudinary or local disk
 */
export const deleteFile = async (publicId, fileUrl) => {
  if (config.cloudinary.isConfigured && publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.warn('[Cloudinary Delete Warning]', error.message);
    }
  }

  // Local file cleanup
  if (fileUrl && fileUrl.startsWith('/uploads/documents/')) {
    const fileName = path.basename(fileUrl);
    const localPath = path.resolve('uploads', 'documents', fileName);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.warn('[Local File Delete Warning]', err.message);
      }
    }
  }

  return true;
};
