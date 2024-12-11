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

@Injectable()
export class RecruitersService {
  constructor(
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly usersService: UsersService,
    @InjectRepository(Recruiter)
    private readonly recruitersRepository : Repository<Recruiter>,
    private readonly dataSource: DataSource,
  ){}

  async create(createRecruiterDto: CreateRecruiterDto, createUserDto: CreateUserDto): Promise<any> {
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

        return { user, recruiter };
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

  findOne(id: string) {
    return `This action returns a #${id} recruiter`;
  }

  async update(id: string, updateRecruiterDto: UpdateRecruiterDto) {
    const { ...toUpdate } = updateRecruiterDto;
    const recruiter = await this.recruitersRepository.preload({
      id,
      ...toUpdate
    });
    if(!recruiter) throw new NotFoundException(`Recruiter with id ${id} not found`);

    // Query Runner
    const queryRunnder = this.dataSource.createQueryRunner();
    await queryRunnder.connect();
    await queryRunnder.startTransaction();

    try {
      await queryRunnder.manager.save(recruiter);
      await queryRunnder.commitTransaction();
      await queryRunnder.release();

      return await this.findRecruiterWithUser(recruiter.id)
    } catch (error) {
      await queryRunnder.rollbackTransaction();
      await queryRunnder.release();
      this.errorHandlerService.handleDBException(error)
    }
  }

  remove(id: number) {
    return `This action removes a #${id} recruiter`;
  }

  async findRecruiterWithUser(id: string): Promise<Recruiter>{
    return await this.recruitersRepository.findOne({
      where: {id},
      relations: ['user']
    })
  }

  // async addRecruiterToCompany(userId: string, companyId: string): Promise<Recruiter>{
  //   const recruiter = await this.findRecruiterWithUser(userId);
  //   const company = await this.
  //   recruiter.companies.push(company);
  //   return this.recruitersRepository.save(recruiter);
  // }
}
