import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';

@Controller('recruiters')
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) {}

  @Post()
  create(@Body('recruiter') createRecruiterDto: CreateRecruiterDto, @Body('user') createUserDto: CreateUserDto) {
    return this.recruitersService.create(createRecruiterDto, createUserDto);
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
  @Auth(ValidRoles.company)
  @Post(':recruiterId')
  async addRecruiterToCompany(
    @Param('recruiterId', ParseUUIDPipe,) recruiterId: string, 
    @GetUser() user: User
  ){
    return this.recruitersService.addRecruiterToCompany(recruiterId, user)
  }
}
