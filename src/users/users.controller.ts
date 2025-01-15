import { Controller, Post, Body, Get, Query, Patch, Param, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ActivateUserDto } from './dto/activate-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Auth, GetUser } from 'src/auth/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ValidRoles } from './interfaces/valid-roles';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly cloudinaryService: CloudinaryService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('activate')
  activateAccount(@Query() activateUserDto: ActivateUserDto) {
    return this.usersService.activateUser(activateUserDto)
  }

  @Patch('update/:id')
  updateAccount(@Body() updateUserDto: UpdateUserDto, @Param('id') id: string) {
    return this.usersService.updateUser(updateUserDto, id)
  }

  @Auth(ValidRoles.candidate, ValidRoles.recruiter, ValidRoles.company)
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
  // @Patch('change-password')
  // @UseGuards(AuthGuard())
  // changePassword( @Body() changePasswordDto: ChangePasswordDto, @GetUser() user: User ): Promise<void> {
  //     return this.userService.changePassword(changePasswordDto, user);
  // }
}
