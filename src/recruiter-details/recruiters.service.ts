import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
import { AuthService } from 'src/auth/auth.service';
import { EncoderService } from 'src/common/encoder.service';
import { Invitation } from './entities/invitations.entity';

@Injectable()
export class RecruitersService {
  constructor(
    @InjectRepository(Recruiter)
    private readonly recruitersRepository : Repository<Recruiter>,
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly encoderService: EncoderService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly companiesService: CompaniesService,
    private readonly mailService: MailService,
    private readonly authService: AuthService
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
    return this.recruitersRepository.find({
      relations: ['user','companies', 'offer']
    });
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
      relations: ['user','companies', 'offer']
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
      relations: ['user','companies', 'offer']
    })
    if(!recruiter) throw new NotFoundException(`Recruiter with id ${id} not found`)
    return recruiter;
  }

  async addRecruiterToCompany(token: string) {
    const invitation = await this.invitationsRepository.findOne({
      where: { token },
      relations: ['recruiter', 'recruiter.companies', 'company'],
    });
    
    console.log(invitation);
  
    if (!invitation) {
      throw new Error('Invitation not found');
    }
  
    const recruiter = invitation.recruiter;
    const company = invitation.company;
  
    if (!recruiter) {
      throw new Error('Recruiter not found');
    }
    if (!recruiter.companies) {
      recruiter.companies = [];
    }
    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date();
    // Guardamos la invitación
    await this.invitationsRepository.save(invitation);
    recruiter.companies.push(company);
    // Guardamos el reclutador
    return this.recruitersRepository.save(recruiter);
  }

  async checkRoute(token: string): Promise<boolean> {
    const invitation = await this.invitationsRepository.findOne({
      where: { token },
      relations: ['recruiter', 'recruiter.companies', 'company'],
    });

    if(!invitation){
      return false
    }
    if(invitation.status === 'ACCEPTED'){
      return false
    }
    
    return true
    
  }

  async SendInvitationToRecruiter(userCompany: User, emailRecruiter: string): Promise<void> {
    const company = await this.companiesService.findOneByUserId(userCompany.id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
  
    const userRecruiter = await this.usersService.finOneByEmail(emailRecruiter);
    if (!userRecruiter) {
      throw new NotFoundException('Recruiter not found');
    }
  
    const recruiter = await this.findOneByUserId(userRecruiter.id);
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }
  
    // Crear la invitación en la base de datos
    const token = await this.encoderService.generateToken();
    const invitation = new Invitation();
    invitation.recruiter = recruiter;
    invitation.company = company;
    invitation.status = 'PENDING';
    invitation.token = token;
  
    try {
      await this.invitationsRepository.save(invitation);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error saving invitation');
    }
  
    const url = `${this.mailService.frontUrl}/company-request/${token}`;
    try {
      await this.mailService.sendRecruiterCompanyRequest(recruiter, company, url);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(`Error sending email to ${emailRecruiter}`);
    }
  }
  
  async getRecruitersByCompany(user : User){
    const company = await this.companiesService.findOneByUserId(user.id)
    if(!company){
      throw new NotFoundException('Company Not founded')
    }
    const { id : companyId } = company

    const recruiters = await this.recruitersRepository.find({
      where: {companies: { id : companyId } },
      relations: ['user','companies', 'offer']
    })

    return recruiters;
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
