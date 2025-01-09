import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { User } from 'src/users/entities/user.entity';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';

@Injectable()
export class CompaniesService {

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository : Repository<Company>,
    private readonly usersService: UsersService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly dataSource: DataSource
  ){}  

  async create(createCompanyDto: CreateCompanyDto, createUserDto: CreateUserDto): Promise<Company> {
    return await executeWithTransaction(this.dataSource, async (queryRunner) => {
      try {
        const user = await this.usersService.prepareUserForTransaction(createUserDto);
        user.roles = [ValidRoles.company]
        await queryRunner.manager.save(user)
        const company = await this.prepareCompanyForTransaction(createCompanyDto, user);
        await queryRunner.manager.save(company)

        return this.sanitizeUserForCompany(company)
      } catch (error) {
        this.errorHandlerService.handleDBException(error)
      }
    });
  }

  async sanitizeUserForCompany(company: Company) {
    delete company.user.activationToken
    delete company.user.resetPasswordToken
    delete company.user.password
    return company
  }

  async prepareCompanyForTransaction(createCompanyDto: CreateCompanyDto, user: User) : Promise<Company> {
    const company = this.companyRepository.create({
      ...createCompanyDto,
      user
    });
    return company;
  }
  

  findAll() {
    return `This action returns all companies`;
  }

  async findOne(id: string) : Promise<Company>{
    const company = await this.companyRepository.findOne({
      where: {id},
      relations: ['user']
    })
    if(!company) throw new NotFoundException(`Company with id ${id} not found`)
    return this.sanitizeUserForCompany(company);
  }

  update(id: number, updateCompanyDto: UpdateCompanyDto) {
    return `This action updates a #${id} company`;
  }

  remove(id: number) {
    return `This action removes a #${id} company`;
  }

  async findCompanyWithUser(id:string): Promise<Company>{
    const company = await this.companyRepository.findOne({
      where: {id},
      relations: ['user']
    })
    if(!company) throw new NotFoundException(`Company with id ${id} not found`)
    return company;
  }
}
