import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { Candidate } from './entities/candidate.entity';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';
import { ErrorHandlerService } from 'src/common/error-handler.service';

@Injectable()
export class CandidateService {

  constructor(    
    @InjectRepository(Candidate) private readonly candidateRepository: Repository<Candidate> ,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly errrorHandlerService: ErrorHandlerService
  ){}

  async create(createCandidateDto: CreateCandidateDto, createUserDto: CreateUserDto): Promise<Candidate> {
    return await executeWithTransaction(this.dataSource, async (queryRunner) => {
      try {
        const user = await this.usersService.prepareUserForTransaction(createUserDto)
        user.roles = [ValidRoles.candidate]
        await queryRunner.manager.save(user);

        const candidate = await this.prepareCandidateForTransaction(createCandidateDto, user);
        await queryRunner.manager.save(candidate);
        return candidate;
      } catch (error) {
        this.errrorHandlerService.handleDBException(error); 
      }
    });
  }

  async prepareCandidateForTransaction(createCandidateDto: CreateCandidateDto, user: User) {
    const candidate = await this.candidateRepository.create({
      ...createCandidateDto,
      user: user,
    });
    return candidate;
  }

  async update(id: string, updateCandidateDto: CreateCandidateDto){
    const candidate = await this.candidateRepository.findOneBy({ id});
    if(!candidate){
      throw new BadRequestException('User not found')
    }
    await this.candidateRepository.update(id, updateCandidateDto);
    // await this.candidateRepository.save(candidate);
    return {
      message: 'Candidate updated successfully'
    }
  }

  async updateByUserId(user_id: string, updateCandidateDto: CreateCandidateDto){
    const candidate = await this.candidateRepository.findOneBy({user_id: user_id});
    if(!candidate){
      throw new BadRequestException('User not found')
    }
    await this.candidateRepository.update(candidate.id, updateCandidateDto);
    // await this.candidateRepository.save(candidate);
    return {
      message: 'Candidate updated successfully'
    }
  }

  async updateCvUrl(url: string, id: string){
    await this.updateByUserId(id, {cvUrl: url});
    return {
      message: 'CV updated successfully'
    }
  }
  // async updateProfileImageUrl(url: string, id: string){
  //   await this.usersRepository.update(id, {profileImageUrl: url});
  //   return {
  //     message: 'Profile image updated successfully'
  //   }
  // }



}
