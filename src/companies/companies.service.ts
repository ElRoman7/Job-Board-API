import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { ErrorHandlerService } from 'src/common/error-handler.service';

@Injectable()
export class CompaniesService {

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository : Repository<Company>,
    private readonly usersService: UsersService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly dataSource: DataSource
  ){}
  
  // Recibe el createCompanyDto sin el id del usuario que posteriormente será creado
  async create(createCompanyDto: CreateCompanyDto, createUserDto: CreateUserDto) {
    if(!createUserDto.roles.includes(ValidRoles.company)) throw new UnauthorizedException(`User needs ${ValidRoles.company} role`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      const user = await this.usersService.create(createUserDto);
      // Crea la compañía asignando el user_id manualmente
      const company = this.companyRepository.create({
        ...createCompanyDto,
        user: user
      });

      await queryRunner.manager.save(company);
      await queryRunner.commitTransaction();
      return company; // Devuelve la compañía creada
    } catch (error) {
      await queryRunner.rollbackTransaction()
      return this.errorHandlerService.handleDBException(error);
    } finally {
      // Liberar el queryRunner
      await queryRunner.release();
    }
  }
  

  findAll() {
    return `This action returns all companies`;
  }

  findOne(id: string) {
    return this.findCompanyWithUser(id);
  }

  update(id: number, updateCompanyDto: UpdateCompanyDto) {
    return `This action updates a #${id} company`;
  }

  remove(id: number) {
    return `This action removes a #${id} company`;
  }

  async findCompanyWithUser(id:string): Promise<Company>{
    return await this.companyRepository.findOne({
      where: {id},
      relations: ['user']
    })
  }
}
