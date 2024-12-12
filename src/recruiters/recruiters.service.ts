import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateRecruiterDto } from './dto/create-recruiter.dto';
import { UpdateRecruiterDto } from './dto/update-recruiter.dto';
import { UsersService } from 'src/users/users.service';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Recruiter } from './entities/recruiter.entity';
import { DataSource, Repository } from 'typeorm';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';
import { User } from 'src/users/entities/user.entity';
import { CompaniesService } from 'src/companies/companies.service';

@Injectable()
export class RecruitersService {
  constructor(
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly usersService: UsersService,
    @InjectRepository(Recruiter)
    private readonly recruitersRepository : Repository<Recruiter>,
    private readonly dataSource: DataSource,
    private readonly companiesService: CompaniesService
  ){}

  async create(createRecruiterDto: CreateRecruiterDto, createUserDto: CreateUserDto): Promise<Recruiter> {
    if (!createUserDto.roles.includes(ValidRoles.recruiter)) {
      throw new UnauthorizedException(`User needs ${ValidRoles.recruiter} role`);
    }
    return await executeWithTransaction(this.dataSource, async (queryRunner) => {
      try {
        // Transaccion del Usuario
        const user = await this.usersService.prepareUserForTransaction(createUserDto)
        await queryRunner.manager.save(user);
        // Transaccion del Recruiter
        const recruiter = await this.prepareRecruiterForTransaction(createRecruiterDto, user)
        await queryRunner.manager.save(recruiter);

        return recruiter;
      } catch (error) {
        this.errorHandlerService.handleDBException(error); // Manejo de errores con el ErrorHandler
      }
    });
  }

  async prepareRecruiterForTransaction(createRecruiterDto: CreateRecruiterDto, user : User) {
    const recruiter = this.recruitersRepository.create({
      ...createRecruiterDto,
      user: user, // Asociamos el usuario previamente creado
    });
    return recruiter
  }

  // async updateUserToRecruiter(createRecruiterDto: CreateRecruiterDto) {
  //   const { user_id, ...rest } = createRecruiterDto;
  //   const user = await this.usersService.findOneById(user_id)
  //   if(!user) throw new UnauthorizedException('User Id is not valid, user with that id dont exists');
  //   if(!user.roles.includes(ValidRoles.recruiter)) throw new UnauthorizedException('User must have recruiter rol');
  //   try {
  //     const recruiter = this.recruitersRepository.create({
  //       ...rest,
  //       user_id
  //     });
  //     await this.recruitersRepository.save(recruiter)

  //     return recruiter;

  //   } catch (error) {
  //     this.errorHandlerService.handleDBException(error)
  //   }
  // }

  findAll() {
    return `This action returns all recruiters`;
  }

  async findOne(id: string) {
    const recruiter = await this.recruitersRepository.findOne({
      where: {id}
    })
    if(!recruiter) throw new NotFoundException(`Recruiter with id ${id} not found`)
    return recruiter;
  }

  async update(id: string, updateRecruiterDto: UpdateRecruiterDto) {
    const recruiter = await this.recruitersRepository.preload({
      id,
      ...updateRecruiterDto
    });
    if(!recruiter) throw new NotFoundException(`Recruiter with id ${id} not found`);

    return await executeWithTransaction(this.dataSource, async (queryRunner) => {
      try {
        await queryRunner.manager.save(recruiter)
        return recruiter;
      } catch (error) {
        this.errorHandlerService.handleDBException(error);
      }
    });

  }

  remove(id: number) {
    return `This action removes a #${id} recruiter`;
  }

  async findRecruiterWithRelations(id: string): Promise<Recruiter>{
    const recruiter = await this.recruitersRepository.findOne({
      where: {id},
      relations: ['user','companies']
    })
    if(!recruiter) throw new NotFoundException(`Recruiter with id ${id} not found`)
    return recruiter;
  }

  async addRecruiterToCompany(recruiterId: string, companyId: string): Promise<Recruiter> {
    const recruiter = await this.findRecruiterWithRelations(recruiterId)
    if (!recruiter) throw new NotFoundException(`Recruiter with id ${recruiterId} not found`);

    const company = await this.companiesService.findOne(companyId)
    if (!company) throw new NotFoundException(`Company with id ${companyId} not found`);

    recruiter.companies.push(company);
    return this.recruitersRepository.save(recruiter);
  }
}
