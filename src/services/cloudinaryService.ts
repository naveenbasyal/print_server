import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "college_print_files",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        console.log("result", result);

        resolve({
          secure_url: result!.secure_url,
          public_id: result!.public_id,
        });
      }
    );

    const readable = Readable.from(file.buffer);
    readable.pipe(stream);
  });
};

export const deleteFromCloudinary = (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve();
    });
  });
};
