import AWS from "aws-sdk";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType = "application/pdf"
): Promise<string> {
  console.log("[S3 Upload] Starting upload...");
  console.log("[S3 Config] Region:", process.env.AWS_REGION);
  console.log("[S3 Config] Bucket:", process.env.AWS_S3_BUCKET);
  console.log("[S3 Upload] Key:", key);
  console.log("[S3 Upload] ContentType:", contentType);
  console.log("[S3 Upload] Buffer  size:", buffer.length, "bytes");

  try {
    await s3
      .putObject({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // ACL: "public-read", // optional, only if you want direct public access
      })
      .promise();

    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log("[S3 Upload] Upload successful. URL:", url);

    return url;
  } catch (error) {
    console.error("[S3 Upload] Upload failed:", error);
    throw error;
  }
}

export function getSignedUrlFromS3(
  key: string,
  expiresIn: number = 3600
): string {
  return s3.getSignedUrl("getObject", {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: expiresIn,
  });
}
