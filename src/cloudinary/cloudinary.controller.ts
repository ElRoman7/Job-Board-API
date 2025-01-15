import { Controller, FileTypeValidator, InternalServerErrorException, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from 'src/users/users.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from 'src/users/interfaces/valid-roles';

@Controller('cloudinary')
export class CloudinaryController {
    
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly usersService: UsersService
    ) {}

    @Auth(ValidRoles.candidate, ValidRoles.company, ValidRoles.recruiter)
    @Post('profile-image')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProfileImage(
    @GetUser() user: User, 
    @UploadedFile(
        new ParseFilePipe({
        validators: [
            new MaxFileSizeValidator({maxSize: 1024 * 1024 * 4}),
            new FileTypeValidator({fileType: '.(png|jpg|jpeg|webp)'})
        ]
        })
    ) file : Express.Multer.File
    ) {
    try {
        const fileUploaded = await this.cloudinaryService.uploadFile(file, 'profile-images', user.id);
        const response = await this.usersService.updateProfileImageUrl(fileUploaded.url, user.id)
        return{
        fileUrl: fileUploaded.url,
        response
        }
    } catch (error) {
        throw new InternalServerErrorException('Failed to upload image', error);
    }
    }
}
