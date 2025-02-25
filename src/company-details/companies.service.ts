import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from './entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { User } from 'src/users/entities/user.entity';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';
import { MailService } from 'src/mail/mail.service';
import { Industry } from './entities/industry.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CompaniesService implements OnModuleInit {

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository : Repository<Company>,
    private readonly usersService: UsersService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    @InjectRepository(Industry)
    private readonly industryRepository: Repository<Industry>,
  ){}  

  async onModuleInit() {
    await this.loadIndustriesFromJson();
  }

  async create(createCompanyDto: CreateCompanyDto, createUserDto: CreateUserDto): Promise<Company> {
    return await executeWithTransaction(this.dataSource, async (queryRunner) => {
      try {
        const user = await this.usersService.prepareUserForTransaction(createUserDto);
        user.roles = [ValidRoles.company]
        await queryRunner.manager.save(user)

        const company = await this.prepareCompanyForTransaction(createCompanyDto, user, queryRunner);
        await queryRunner.manager.save(company)

        try {
          await this.mailService.sendUserConfirmation(user);  // Usando await para esperar a que el correo se envíe
        } catch (e) {
          throw new Error(`User creation failed: Unable to send confirmation email ${e}`);
        }

        return company;
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

  async prepareCompanyForTransaction(createCompanyDto: CreateCompanyDto, user: User, queryRunner: QueryRunner): Promise<Company> {
    let industries: Industry[] = [];
    if (createCompanyDto.industries && createCompanyDto.industries.length > 0) {
        industries = await queryRunner.manager.findBy(Industry, { id: In(createCompanyDto.industries) });
    }

    // Crear la empresa con las industrias encontradas
    const company = this.companyRepository.create({
      ...createCompanyDto,
      user,
      industries, // Ahora se asignan los objetos Industry en lugar de los IDs
    });

    return company;
  }

  findAll() {
    return `This action returns all companies`;
  }

  async findOne(id: string) : Promise<Company>{
    const company = await this.companyRepository.findOne({
      where: {id},
      relations: {
        user: true,
        industries: true,
      }
    })
    if(!company) throw new NotFoundException(`Company with user id ${id} not found`)
    return company;
  }

  async findOneByUserId(id: string) : Promise<Company>{
    const company = await this.companyRepository.findOne({
      where: {user_id: id},
      relations: {
        user: true,
        industries: true
      }
    });
    return company;
  }

  // Método para cargar las industrias desde un archivo JSON
  async loadIndustriesFromJson(): Promise<void> {
    const filePath = path.join(__dirname , 'data/industries.json');
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const industries = JSON.parse(fileContent);
      

      // Guarda las industrias en la base de datos si no existen
      for (const industry of industries) {
        const exists = await this.industryRepository.findOne({ where: { name: industry.name } });
        if (!exists) {
          await this.industryRepository.save(industry);
        }
      }

      console.log('Industrias cargadas exitosamente.');
    } catch (error) {
      console.error('Error al cargar el archivo de industrias:', error);
    }
  }

  // Método para obtener las industrias
  async getIndustries(): Promise<Industry[]> {
    return await this.industryRepository.find();
  }
}
