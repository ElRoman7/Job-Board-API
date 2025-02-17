import { Controller, FileTypeValidator, InternalServerErrorException, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from 'src/users/users.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { CandidateService } from 'src/candidate-details/candidate.service';

@Controller('cloudinary')
export class CloudinaryController {
    
    constructor(
        private readonly cloudinaryService: CloudinaryService,
        private readonly candidateService: CandidateService,
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
        const fileUploaded = await this.cloudinaryService.uploadFile(file, 'profile-images', user.id, 'image');
        const response = await this.usersService.updateProfileImageUrl(fileUploaded.url, user.id)
        return{
        fileUrl: fileUploaded.secure_url,
        response
        }
    } catch (error) {
        throw new InternalServerErrorException('Failed to upload image', error);
    }
    }

    // Subir cv del candidato
    @Auth(ValidRoles.candidate)
    @Post('cv')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCV(
        @GetUser() user: User, 
        @UploadedFile(
            new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
                new FileTypeValidator({ fileType: 'application/pdf' })
            ]
            })
        ) file: Express.Multer.File
    ) {
        try {
            // Subir el archivo como 'raw' para asegurar que se maneje correctamente
            const fileUploaded = await this.cloudinaryService.uploadFile(file, 'cv', user.id, 'image');
            
            // Actualizar la URL del CV en la base de datos
            const response = await this.candidateService.updateCvUrl(fileUploaded.secure_url, user.id);
            
            return {
                fileUrl: fileUploaded.secure_url,  // Devolver la URL segura del archivo
                response
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed to upload CV', error);
        }
    }
    

}
