import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer to Cloudinary via stream
 * @param {Buffer} buffer - File buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @param {String} resource_type - 'image', 'video', 'raw', 'auto'
 */
export const uploadToCloudinary = (
  buffer,
  folder = "healthbridge",
  resource_type = "auto",
) => {
  return new Promise((resolve, reject) => {
    // Return mock response if Cloudinary is not configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name"
    ) {
      return resolve({
        secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        public_id: `mock_${Date.now()}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public_id
 * @param {String} resource_type - 'image', 'video', 'raw'
 */
export const deleteFromCloudinary = async (
  publicId,
  resource_type = "image",
) => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name"
    ) {
      return;
    }
    await cloudinary.uploader.destroy(publicId, { resource_type });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

export default cloudinary;
