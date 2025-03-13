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

  // @Get('/:id')
  // findCandidateById() {

  // }
}
