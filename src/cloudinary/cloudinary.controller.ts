import { Controller, FileTypeValidator, InternalServerErrorException, MaxFileSizeValidator, ParseFilePipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from 'src/users/users.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { CandidateService } from 'src/candidate-details/services/candidate.service';
import axios from 'axios';
import * as pdfParse from 'pdf-parse';
import { CvService } from 'src/candidate-details/services/cv.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly candidateService: CandidateService,
    private readonly usersService: UsersService,
    private readonly cvService: CvService,
  ) {}

  @Auth(ValidRoles.candidate, ValidRoles.company, ValidRoles.recruiter)
  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 4 }),
          new FileTypeValidator({ fileType: '.(png|jpg|jpeg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const fileUploaded = await this.cloudinaryService.uploadFile(
        file,
        'profile-images',
        user.id,
        'image',
      );
      const response = await this.usersService.updateProfileImageUrl(
        fileUploaded.url,
        user.id,
      );
      return {
        fileUrl: fileUploaded.secure_url,
        response,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload image', error);
    }
  }

  @Auth(ValidRoles.candidate)
  @Post('cv')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCV(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // 📌 Subir el archivo a Cloudinary
      const fileUploaded = await this.cloudinaryService.uploadFile(
        file,
        'cv',
        user.id,
        'raw',
      );

      // 📌 Descargar el PDF desde la URL de Cloudinary
      const response = await axios.get(fileUploaded.secure_url, {
        responseType: 'arraybuffer',
      });
      const pdfBuffer = Buffer.from(response.data);

      // 📌 Extraer texto del PDF
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text;
      await this.cvService.procesarCV(extractedText, user);

      // 📌 Guardar la URL del CV en la base de datos
      await this.candidateService.updateCvUrl(fileUploaded.secure_url, user.id);

      return {
        fileUrl: fileUploaded.secure_url, // URL del archivo en Cloudinary
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to upload or parse CV',
        error,
      );
    }
  }
}
