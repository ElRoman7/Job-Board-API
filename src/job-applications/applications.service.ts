import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationDto } from './dto/create-application.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { CandidateService } from 'src/candidate-details/candidate.service';
import { User } from 'src/users/entities/user.entity';
import { OffersService } from 'src/offers/offers.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly candidateService: CandidateService,
    private readonly offersService: OffersService,
  ) {}

  async apply(applicationDto: ApplicationDto, user: User) {
    const { offerId, coverLetter } = applicationDto;
    const candidate = await this.candidateService.findOneByUserId(user.id);
    if (!candidate) {
      throw new NotFoundException('Candidate not Found');
    }
    const offer = await this.offersService.findOne(offerId);
    if (!offer) {
      throw new NotFoundException('Offer not Found');
    }

    const findApplication = await this.findOneApplication(
      candidate.id,
      offerId,
    );
    if (findApplication) {
      throw new BadRequestException('You have already applied to this offer');
    }

    try {
      const application = this.applicationRepository.create({
        coverLetter,
        offer: offer,
        candidate: candidate,
      });
      return await this.applicationRepository.save(application);
    } catch (error) {
      return this.errorHandlerService.handleDBException(error);
    }
  }

  async findOneApplication(
    candidateId: string,
    offerId: string,
  ): Promise<Application> {
    const findApplication = await this.applicationRepository.findOne({
      where: {
        candidate: { id: candidateId },
        offer: { id: offerId },
      },
      relations: {
        candidate: {
          user: true,
        },
        offer: {
          company: {
            user: true, // Relación con usuario de la compañía
            industries: true, // Relación con industrias
          },
          recruiter: {
            user: true, // Relación con usuario del reclutador
          },
          modalityTypes: true, // Relación con modalidad de trabajo
          contractTypes: true, // Relación con tipos de contrato
          experienceLevels: true, // Relación con niveles de experiencia
          workAreas: true, // Relación con áreas de trabajo
          additionalBenefits: true, // Relación con beneficios adicionales
        },
      },
    });
    return findApplication;
  }

  async getTotalApplications(user: User) {
    const totalApplications = await this.applicationRepository.find({
      where: {
        offer: {
          company: {
            user_id: user.id,
          },
        },
      },
    });
    return totalApplications.length;
  }
}
