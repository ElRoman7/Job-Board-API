import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ActivateUserDto } from './dto/activate-user.dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('activate')
  activateAccount(@Query() activateUserDto: ActivateUserDto) {
    return this.usersService.activateUser(activateUserDto)
  }


  // @Patch('change-password')
  // @UseGuards(AuthGuard())
  // changePassword( @Body() changePasswordDto: ChangePasswordDto, @GetUser() user: User ): Promise<void> {
  //     return this.userService.changePassword(changePasswordDto, user);
  // }
}
