import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { CandidateService } from './services/candidate.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';
import { AddSkillDto } from './dto/add-skill.dto';

@Controller('candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  create(
    @Body('candidate') createCandidateDto: CreateCandidateDto,
    @Body('user') createUserDto: CreateUserDto,
  ) {
    return this.candidateService.create(createCandidateDto, createUserDto);
  }

  @Get()
  getCandidates() {
    return this.candidateService.findAll();
  }

  @Get('/user/:id')
  findCandidateById(@Param('id', ParseUUIDPipe) id: string) {
    return this.candidateService.findOneByUserId(id);
  }

  @Auth(ValidRoles.candidate)
  @Post('/skill')
  addSkillToCandidate(@Body() addSkillDto: AddSkillDto, @GetUser() user: User) {
    return this.candidateService.addSkillToCandidate(addSkillDto, user);
  }

  // @Get('/:id')
  // findCandidateById() {

  // }
}
