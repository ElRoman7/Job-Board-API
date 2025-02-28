import { Controller, Post, Body, Get } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('candidate')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService
  ) {}

  @Post()
  create(@Body('candidate') createCandidateDto: CreateCandidateDto, @Body('user') createUserDto: CreateUserDto) {
    return this.candidateService.create(createCandidateDto, createUserDto);
  }

  @Get()
  getCandidates(){
    return this.candidateService.findAll();
  }


}
