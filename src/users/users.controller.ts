import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ActivateUserDto } from './dto/activate-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from './interfaces/valid-roles';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('activate')
  activateAccount(@Query() activateUserDto: ActivateUserDto) {
    return this.usersService.activateUser(activateUserDto);
  }

  // ToDo: Request reset password and reset password method (Repo: auth-nestjs)
  @Auth(ValidRoles.candidate, ValidRoles.company, ValidRoles.recruiter)
  @Patch('reset-password')
  resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @GetUser() user: User,
  ) {
    return this.usersService.resetPassword(resetPasswordDto, user);
  }

  @Get(':id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.usersService.getUserById(id);
  }

  @Auth(ValidRoles.candidate, ValidRoles.company, ValidRoles.recruiter)
  @Patch(':id')
  updateAccount(@Body() updateUserDto: UpdateUserDto, @Param('id') id: string) {
    return this.usersService.updateUser(updateUserDto, id);
  }
}
