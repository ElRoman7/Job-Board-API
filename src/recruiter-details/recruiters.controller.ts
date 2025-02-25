import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';
import { EmailToCompanyRecruiterDTO } from './dto/email-company-recruiter.dto';

@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @Post()
  create(@Body('recruiter') createRecruiterDto: CreateRecruiterDto, @Body('user') createUserDto: CreateUserDto) {
    return this.recruitersService.create(createRecruiterDto, createUserDto);
  }

  @Auth(ValidRoles.company)
  @Post('send-invitation')
  async sendInvitationToRecruiter(
    @GetUser() user: User,
    @Body() emailToCompanyRecruiterDTO : EmailToCompanyRecruiterDTO
  ) {
    return this.recruitersService.SendInvitationToRecruiter(user, emailToCompanyRecruiterDTO.email);
  }

  @Auth(ValidRoles.company)
  @Post('/company/:token')
  async addRecruiterToCompany(
    @Param('token', ParseUUIDPipe,) token: string, 
  ){
    return await this.recruitersService.addRecruiterToCompany(token);
  }

  @Auth(ValidRoles.company)
  @Get('/company/:token')
  async checkRoute(
    @Param('token', ParseUUIDPipe,) token: string, 
  ){
    return await this.recruitersService.checkRoute(token);
  }

  @Get()
  findAll() {
    return this.recruitersService.findAll();
  }
  @Get('user/:id')
  findRecruiterByUserId(@Param('id') id: string) {
    return this.recruitersService.findOneByUserId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recruitersService.findRecruiterWithRelations(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateRecruiterDto: UpdateRecruiterDto,
  ) {
    return this.recruitersService.update(id, updateRecruiterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recruitersService.remove(+id);
  }

  //: upgradeUserToRecruiter (funcion para que un usuario se convierta en reclutador)

}
