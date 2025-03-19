import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation } from './entities/invitations.entity';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { RecruitersService } from './recruiters.service';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { CompaniesService } from 'src/company-details/companies.service';
import { UsersService } from 'src/users/users.service';
import { EncoderService } from 'src/common/encoder.service';
import { MailService } from 'src/mail/mail.service';
import { NotificationsService } from '../notifications-ws/notifications.service';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    private readonly recruitersService: RecruitersService,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly encoderService: EncoderService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkRoute(token: string): Promise<boolean> {
    const invitation = await this.invitationsRepository.findOne({
      where: { token },
      relations: ['recruiter', 'recruiter.companies', 'company'],
    });

    if (!invitation) {
      return false;
    }
    if (invitation.status === 'ACCEPTED') {
      return false;
    }

    return true;
  }
  async findOne(token: string) {
    return await this.invitationsRepository.findOne({ where: { token } });
  }

  async SendInvitationToRecruiter(
    userCompany: User,
    emailRecruiter: string,
  ): Promise<{ message: string }> {
    const company = await this.companiesService.findOneByUserId(userCompany.id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const userRecruiter = await this.usersService.finOneByEmail(emailRecruiter);
    if (!userRecruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const recruiter = await this.recruitersService.findOneByUserId(
      userRecruiter.id,
    );
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    // Check if there's an existing invitation
    const existingInvitation = await this.invitationsRepository.findOne({
      where: {
        company: { id: company.id },
        recruiter: { id: recruiter.id },
      },
      relations: ['company', 'recruiter'],
    });

    // If there's an existing invitation that's pending or accepted, don't allow a new one
    if (existingInvitation) {
      if (existingInvitation.status === 'ACCEPTED') {
        return {
          message: `El reclutador ya forma parte de tu red de reclutamiento`,
        };
      }

      if (existingInvitation.status === 'PENDING') {
        return {
          message: `Ya existe una invitación pendiente para este reclutador`,
        };
      }
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

    const url = `${this.mailService.frontUrl}/recruiter/companies`;
    try {
      await this.mailService.sendRecruiterCompanyRequest(
        recruiter,
        company,
        url,
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `Error sending email to ${emailRecruiter}`,
      );
    }
    const message = `Has recibido una invitación de ${company.user.name} para ser parte de su red de reclutamiento`;

    await this.notificationsService.createNotification(
      recruiter.user.id,
      message,
      `/recruiters/companies`,
    );

    return { message: 'Invitación enviada exitosamente' };
  }

  async getInvitationsByRecruiter(user: User) {
    const recruiter = await this.recruitersService.findOneByUserId(user.id);
    if (!recruiter) {
      throw new NotFoundException('Recruiter Not Founded');
    }
    const invitations = await this.invitationsRepository.find({
      where: { recruiter: { user: { id: user.id } }, status: 'PENDING' },
      relations: {
        company: { user: true },
        recruiter: { user: true },
      },
    });
    console.log(invitations);

    return invitations;
  }

  async setInvitationResponse(
    user: User,
    id: string,
    response: 'accept' | 'reject',
  ) {
    const invitation = await this.invitationsRepository.findOne({
      where: { id },
      relations: ['recruiter', 'recruiter.user', 'company'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const recruiter = await this.recruitersService.findOneByUserId(user.id);
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const company = await this.companiesService.findOne(invitation.company.id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (
      invitation.company.id != company.id ||
      invitation.recruiter.id != recruiter.id
    ) {
      throw new UnauthorizedException("User can't accept the invitation"); //No es la invitacion para el usuario que la quiere aceptar
    }

    return await executeWithTransaction(
      this.dataSource,
      async (queryRunner) => {
        if (response === 'accept') {
          try {
            // Establish the many-to-many relationship
            if (!company.recruiters) company.recruiters = [];
            if (!recruiter.companies) recruiter.companies = [];

            company.recruiters.push(recruiter);
            recruiter.companies.push(company);

            // Update invitation status
            invitation.status = 'ACCEPTED';

            // Save all entities
            await queryRunner.manager.save(company);
            await queryRunner.manager.save(recruiter);
            await queryRunner.manager.save(invitation);

            return {
              message: 'Recruiter successfully added to company',
            };
          } catch (error) {
            throw this.errorHandlerService.handleDBException(error);
          }
        } else {
          invitation.status = 'REJECTED';
          await queryRunner.manager.save(invitation);
          return { message: `Invitation rejected successfully.` };
        }
      },
    );
  }

  async addRecruiterToCompany(token: string) {
    return await executeWithTransaction(
      this.dataSource,

      async (queryRunner) => {
        // Find invitation and validate

        const invitation = await this.invitationsRepository.findOne({
          where: { token },

          relations: ['recruiter', 'company'],
        });

        if (!invitation) {
          throw new NotFoundException('Invitation not found');
        }

        if (invitation.status !== 'PENDING') {
          throw new BadRequestException('Invitation is no longer pending');
        }

        // Get company and recruiter with their relationships

        const company = await this.companiesService.findOne(
          invitation.company.id,
        );

        if (!company) {
          throw new NotFoundException('Company not found');
        }

        const recruiter = await this.recruitersService.findOne(
          invitation.recruiter.id,
        );

        if (!recruiter) {
          throw new NotFoundException('Recruiter not found');
        }

        try {
          // Establish the many-to-many relationship

          if (!company.recruiters) company.recruiters = [];

          if (!recruiter.companies) recruiter.companies = [];

          company.recruiters.push(recruiter);

          recruiter.companies.push(company);

          // Update invitation status

          invitation.status = 'ACCEPTED';

          // Save all entities

          await queryRunner.manager.save(company);

          await queryRunner.manager.save(recruiter);

          await queryRunner.manager.save(invitation);

          return {
            message: 'Recruiter successfully added to company',
          };
        } catch (error) {
          throw this.errorHandlerService.handleDBException(error);
        }
      },
    );
  }
}
