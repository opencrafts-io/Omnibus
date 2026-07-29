import multer from "multer";
import path from "path";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// --- S3 Configuration ---
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// ✅ Use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Helper to process, resize, and upload to S3
 * Attaches results to req.images
 */
export const processAndSaveImages = async (req, res, next) => {
  if (!req.files) return next();

  const resizeSettings = {
    event_card_image: { width: 1000, height: 1000 },
    event_banner_image: { width: 1600, height: 900 },
    event_poster_image: { width: 1000, height: 1500 },
  };

  req.images = {}; // Initialize the container for URLs

  try {
    const uploadPromises = Object.keys(resizeSettings).map(async (fieldName) => {
      const file = req.files?.[fieldName]?.[0];
      
      if (file) {
        const { width, height } = resizeSettings[fieldName];
        const ext = path.extname(file.originalname) || ".jpg";
        const filename = `events/${Date.now()}-${fieldName}${ext}`;

        // ✅ 1. Resize directly from memory buffer
        const processedBuffer = await sharp(file.buffer)
          .resize(width, height, { fit: "cover" })
          .toFormat("jpeg", { quality: 80 }) // Optional: convert to optimized jpeg
          .toBuffer();

        // ✅ 2. Prepare S3 Upload Command
        const params = {
          Bucket: BUCKET_NAME,
          Key: filename,
          Body: processedBuffer,
          ContentType: "image/jpeg",
          // ACL: 'public-read', // Uncomment if your bucket uses public ACLs
        };

        // ✅ 3. Execute Upload
        await s3Client.send(new PutObjectCommand(params));

        // ✅ 4. Store the final URL in req.images
        req.images[fieldName] = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
      }
    });

    await Promise.all(uploadPromises);
  } catch (error) {
    res.status(500).json({ error: "Failed to process and upload images." });
  }
};

export default upload;