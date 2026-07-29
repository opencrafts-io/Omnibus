import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Removes uploaded image files (both original and resized versions) from S3.
 * @param {string[]} files - Array of S3 object keys
 */
const extractS3Key = (url) => {
  try {
    return new URL(url).pathname.substring(1);
  } catch {
    return null;
  }
};

export const cleanupFiles = async (files = []) => {
  for (const file of files) {
    if (!file) continue;
    file = extractS3Key(file);
    const resizedVersion = `${file}-resized.jpg`;

    for (const key of [file, resizedVersion]) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          })
        );

      } catch (err) {
        throw err;
      }
    }
  }
};
