import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import 'multer';
import { Readable } from 'stream';
import { CloudinaryResponse } from './cloudinary-response';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Upload a file to Cloudinary
   * @param file The file to upload
   * @param options Optional upload options (folder, transformation, etc)
   */
  uploadFile(
    file: Express.Multer.File | { buffer: Buffer },
    options: Record<string, any> = {},
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      try {
        const readableStream = new Readable({
          read() {
            this.push(file.buffer);
            this.push(null);
          },
        });

        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              this.logger.error(
                `Failed to upload to Cloudinary: ${error.message}`,
              );
              return reject(error);
            }
            if (!result) {
              return reject(
                new InternalServerErrorException(
                  'No result returned from Cloudinary',
                ),
              );
            }
            resolve(result);
          },
        );

        readableStream.pipe(uploadStream);
      } catch (error: any) {
        this.logger.error(`Error in upload process: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Delete a file from Cloudinary by its public ID
   * @param publicId The public ID of the file to delete
   */
  async deleteFile(publicId: string): Promise<CloudinaryResponse> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      this.logger.error(`Failed to delete from Cloudinary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get details of a file from Cloudinary
   * @param publicId The public ID of the file
   */
  async getFileDetails(publicId: string): Promise<CloudinaryResponse> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error: any) {
      this.logger.error(
        `Failed to get details from Cloudinary: ${error.message}`,
      );
      throw error;
    }
  }
}
