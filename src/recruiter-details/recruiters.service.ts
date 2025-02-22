import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { CompaniesService } from 'src/company-details/companies.service';
import { Company } from 'src/company-details/entities/company.entity';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class RecruitersService {
  constructor(
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly usersService: UsersService,
    @InjectRepository(Recruiter)
    private readonly recruitersRepository : Repository<Recruiter>,
    private readonly dataSource: DataSource,
    private readonly companiesService: CompaniesService,
    private readonly mailService: MailService
  ){}

  async create(createRecruiterDto: CreateRecruiterDto, createUserDto: CreateUserDto): Promise<Recruiter> {
    return await executeWithTransaction(this.dataSource, async (queryRunner) => {
      try {
        // Transaccion del Usuario
        const user = await this.usersService.prepareUserForTransaction(createUserDto)
        user.roles = [ValidRoles.recruiter]
        await queryRunner.manager.save(user);
        // Transaccion del Recruiter
        const recruiter = await this.prepareRecruiterForTransaction(createRecruiterDto, user)
        await queryRunner.manager.save(recruiter);
        try {
          await this.mailService.sendUserConfirmation(user);  // Usa await para esperar a que el correo se envíe
        } catch (e) {
          throw new Error(`User creation failed: Unable to send confirmation email ${e}`);
        }
      
        return recruiter
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

  async findOneByUserId(id: string) {
    const recruiter = await this.recruitersRepository.findOne({
      where: {user_id: id},
      relations: ['user']
    })
    // if(!recruiter) throw new NotFoundException(`Recruiter with id ${id} not found`)
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

  async addRecruiterToCompany(recruiterId: string, user: User): Promise<Recruiter> {
    const recruiter = await this.findRecruiterWithRelations(recruiterId)
    if (!recruiter) throw new NotFoundException(`Recruiter with id ${recruiterId} not found`);
    if(!user.roles.includes(ValidRoles.company)){
      throw new ForbiddenException(`User does not have the necessary role`);
    }
    const company = await this.companiesService.findCompanyWithUser(user.id)

    recruiter.companies.push(company);
    return this.recruitersRepository.save(recruiter);
  }

  async getCompaniesForRecruiter(recruiterId: string): Promise<Company[]> {
    const recruiter = await this.recruitersRepository.findOne({
      where: { id: recruiterId },
      relations: ['companies'], // Asegúrate de cargar la relación 'companies'
    });
    if (!recruiter) throw new NotFoundException(`Recruiter with id ${recruiterId} not found`);

    return recruiter.companies;
  }
}
