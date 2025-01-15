import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CloudinaryResponse } from './cloudinary-response';
import { v2 as cloudinary } from 'cloudinary';

import { createReadStream } from 'streamifier';

@Injectable()
export class CloudinaryService {
    uploadFile(file: Express.Multer.File, folder: string, publicId: string): Promise<CloudinaryResponse> {
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { 
                    folder: folder,
                    public_id: publicId,
                    overwrite: true,
                    resource_type: "image"
                },
                (error, result) => {
                    if(error) return reject(error);
                    resolve(result)
                }
            );
            createReadStream(file.buffer).pipe(uploadStream);
        })
    }


    async listFiles(): Promise<string[]> {
        try {
            
            const result = await cloudinary.api.resources();
            return result.resources.map(file => file.url);

        } catch (error) {
            throw new InternalServerErrorException('Failed to list files', error);
            
        }
    }
    /* Get Image By Id */
    async getFile(publicId: string): Promise<string> {
        try {
            const result = await cloudinary.api.resource(publicId);
            return result.secure_url;
        } catch (error) {
            throw new NotFoundException('Image not found', error);
        }
    }

    async deleteFile(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete image', error);
        }
    }
}
