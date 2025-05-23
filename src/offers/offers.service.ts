import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { CompaniesService } from 'src/company-details/companies.service';
import { RecruitersService } from 'src/recruiter-details/recruiters.service';
import { Offer } from './entities/offer.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { User } from 'src/users/entities/user.entity';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import {
  ModalityType,
  ContractType,
  ExperienceLevel,
  WorkArea,
  AdditionalBenefit,
} from './entities/tags.entity';
import { SkillsService } from 'src/skills/skills.service';
import { OfferStatus } from './interfaces/valid-status';
import { ApplicationsService } from 'src/job-applications/applications.service';
import { ApplicationDto } from 'src/job-applications/dto/create-application.dto';
import { RecommendationService } from 'src/recommendation/recommendation.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly companiesService: CompaniesService,
    private readonly recruitersService: RecruitersService,
    private readonly errorHandlerService: ErrorHandlerService,
    @InjectRepository(ModalityType)
    private readonly modalityTypeRepository: Repository<ModalityType>,
    @InjectRepository(ContractType)
    private readonly contractTypeRepository: Repository<ContractType>,
    @InjectRepository(ExperienceLevel)
    private readonly experienceLevelRepository: Repository<ExperienceLevel>,
    @InjectRepository(WorkArea)
    private readonly workAreaRepository: Repository<WorkArea>,
    @InjectRepository(AdditionalBenefit)
    private readonly additionalBenefitRepository: Repository<AdditionalBenefit>,
    private readonly skillsService: SkillsService,
    private readonly applicationsService: ApplicationsService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async create(createOfferDto: CreateOfferDto, user: User) {
    const { companyId, ...rest } = createOfferDto;

    // Obtain related entities
    const relatedEntities = await this.getRelatedEntities(createOfferDto);

    // Get or create required skills
    const requiredSkills = await this.skillsService.findOrCreate(
      createOfferDto.skill,
    );

    let company,
      recruiter = null;

    // Handle user role-specific logic
    if (user.roles.includes('recruiter')) {
      recruiter = await this.recruitersService.findOneByUserId(user.id);
      if (!recruiter) throw new UnauthorizedException(`Recruiter not found`);

      company = await this.companiesService.findOne(companyId);
      await this.validateRecruiterPermissions(recruiter.id, companyId);
    } else {
      // If user is a company
      company = await this.validateCompanyForUser(user.id, companyId);
    }

    // Create and save the offer with all related entities including skills
    const offer = this.offerRepository.create({
      company,
      recruiter,
      requiredSkills,
      ...relatedEntities,
      ...rest,
    });

    return this.offerRepository.save(offer);
  }

  // Obtener entidades relacionadas
  private async getRelatedEntities(createOfferDto: CreateOfferDto) {
    const {
      modalityTypes,
      contractTypes,
      experienceLevels,
      workAreas,
      additionalBenefits,
    } = createOfferDto;

    return {
      modalityTypes: await this.modalityTypeRepository.findBy({
        id: In(modalityTypes.map((m) => m.id)),
      }),
      contractTypes: await this.contractTypeRepository.findBy({
        id: In(contractTypes.map((c) => c.id)),
      }),
      experienceLevels: await this.experienceLevelRepository.findBy({
        id: In(experienceLevels.map((e) => e.id)),
      }),
      workAreas: await this.workAreaRepository.findBy({
        id: In(workAreas.map((w) => w.id)),
      }),
      additionalBenefits: await this.additionalBenefitRepository.findBy({
        id: In(additionalBenefits.map((b) => b.id)),
      }),
    };
  }

  // Validar permisos del reclutador
  private async validateRecruiterPermissions(
    recruiterId: string,
    companyId: string,
  ) {
    const companiesForRecruiter =
      await this.recruitersService.getCompaniesForRecruiter(recruiterId);
    if (!companiesForRecruiter.some((company) => company.id === companyId)) {
      throw new UnauthorizedException(
        `Recruiter does not have permission to publish offers for company ${companyId}`,
      );
    }
  }

  // Validar que la compañía pertenece al usuario
  private async validateCompanyForUser(userId: string, companyId: string) {
    const company = await this.companiesService.findOneByUserId(userId);
    if (!company)
      throw new BadRequestException(`Company with user_id ${userId} not found`);
    if (company.id !== companyId) {
      throw new UnauthorizedException(
        `Company with id ${companyId} does not match with the company of the user`,
      );
    }
    return company;
  }

  // Guardar la oferta en la base de datos
  private saveOffer(data: Partial<Offer>) {
    const offer = this.offerRepository.create(data);
    return this.offerRepository.save(offer);
  }

  /**
   * Retrieves all job offers with pagination and filtering capabilities.
   *
   * @param paginationDto - Data transfer object containing pagination and filter options
   * @returns An object containing the filtered offers, total count, and recruiterId if provided
   *
   * @example
   * // Basic usage with default pagination
   * const result = await offersService.findAll({});
   *
   * @example
   * // With pagination and filters
   * const result = await offersService.findAll({
   *   limit: 10,
   *   offset: 20,
   *   companyId: 123,
   *   modalityTypeIds: [1, 2],
   *   contractTypeIds: [3],
   *   experienceLevelIds: [1, 2],
   *   workAreaIds: [5, 6],
   *   additionalBenefitIds: [10, 11]
   * });
   */
  async findAll(paginationDto: PaginationDto, user: User) {
    const {
      limit = 15,
      offset = 0,
      recruiterId,
      companyId,
      modalityTypeIds,
      contractTypeIds,
      experienceLevelIds,
      workAreaIds,
      additionalBenefitIds,
      searchTerm = '',
    } = paginationDto;

    const whereCondition: any = { status: 'published' };

    if (companyId) {
      whereCondition.company = { id: companyId };
    }

    if (recruiterId) {
      whereCondition.recruiter = { id: recruiterId };
    }

    // Build query builder for more complex filters
    const queryBuilder = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.company', 'company')
      .leftJoinAndSelect('company.user', 'companyUser')
      .leftJoinAndSelect('company.industries', 'industries')
      .leftJoinAndSelect('offer.recruiter', 'recruiter')
      .leftJoinAndSelect('recruiter.user', 'recruiterUser')
      .leftJoinAndSelect('offer.modalityTypes', 'modalityTypes')
      .leftJoinAndSelect('offer.contractTypes', 'contractTypes')
      .leftJoinAndSelect('offer.experienceLevels', 'experienceLevels')
      .leftJoinAndSelect('offer.workAreas', 'workAreas')
      .leftJoinAndSelect('offer.additionalBenefits', 'additionalBenefits')
      .leftJoinAndSelect('offer.applications', 'applications')
      .leftJoinAndSelect('applications.candidate', 'candidate')
      .leftJoinAndSelect('offer.requiredSkills', 'requiredSkills')
      .where(whereCondition)
      .take(limit)
      .skip(offset);

    if (searchTerm) {
      queryBuilder.andWhere(
        'LOWER(offer.title) LIKE LOWER(:searchTerm) OR LOWER(offer.description) LIKE LOWER(:searchTerm)',
        {
          searchTerm: `%${searchTerm}%`,
        },
      );
    }

    // Apply tag filters if provided
    if (modalityTypeIds && modalityTypeIds.length > 0) {
      queryBuilder.andWhere('modalityTypes.id IN (:...modalityTypeIds)', {
        modalityTypeIds,
      });
    }

    if (contractTypeIds && contractTypeIds.length > 0) {
      queryBuilder.andWhere('contractTypes.id IN (:...contractTypeIds)', {
        contractTypeIds,
      });
    }

    if (experienceLevelIds && experienceLevelIds.length > 0) {
      queryBuilder.andWhere('experienceLevels.id IN (:...experienceLevelIds)', {
        experienceLevelIds,
      });
    }

    if (workAreaIds && workAreaIds.length > 0) {
      queryBuilder.andWhere('workAreas.id IN (:...workAreaIds)', {
        workAreaIds,
      });
    }

    if (additionalBenefitIds && additionalBenefitIds.length > 0) {
      queryBuilder.andWhere(
        'additionalBenefits.id IN (:...additionalBenefitIds)',
        { additionalBenefitIds },
      );
    }

    // Execute query
    const offers = await queryBuilder.getMany();

    // Get recommendations for each offer
    const recommendations = await Promise.all(
      offers.map(async (offer) => {
        const recommendation =
          await this.recommendationService.getPersonalizedRecommendations(
            user.id,
            1,
            [offer],
          );
        console.log(recommendation);

        return {
          offer,
          score: recommendation[0]?.matchScore || 0,
        };
      }),
    );

    // Sort offers by recommendation score
    const sortedOffers = recommendations
      .sort((a, b) => b.score - a.score)
      .map(({ offer }) => offer);

    // Count total based on filters
    let total = 0;
    if (recruiterId) {
      total = offers.length;
    } else {
      // Create a clone of the query builder without pagination to get total count
      const countQueryBuilder = queryBuilder
        .clone()
        .skip(0)
        .take(undefined)
        .select('COUNT(DISTINCT offer.id)', 'count');

      const { count } = await countQueryBuilder.getRawOne();
      total = Number(count);
    }
    // console.log(sortedOffers);

    return { offers: sortedOffers, total, recruiterId };
  }

  async findAllByCompany(user: User, paginationDto: PaginationDto) {
    const { limit = 15, offset = 0, recruiterId, companyId } = paginationDto;

    // Get user's company ID if the user is a company
    let userCompanyId: string = null;
    if (user.roles.includes('company')) {
      const company = await this.companiesService.findOneByUserId(user.id);
      if (company) {
        userCompanyId = company.id;
      }
    }

    // Build query builder for more complex filters
    const queryBuilder = this.offerRepository
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.company', 'company')
      .leftJoinAndSelect('company.user', 'companyUser')
      .leftJoinAndSelect('company.industries', 'industries')
      .leftJoinAndSelect('offer.recruiter', 'recruiter')
      .leftJoinAndSelect('recruiter.user', 'recruiterUser')
      .leftJoinAndSelect('offer.modalityTypes', 'modalityTypes')
      .leftJoinAndSelect('offer.contractTypes', 'contractTypes')
      .leftJoinAndSelect('offer.experienceLevels', 'experienceLevels')
      .leftJoinAndSelect('offer.workAreas', 'workAreas')
      .leftJoinAndSelect('offer.additionalBenefits', 'additionalBenefits')
      .leftJoinAndSelect('offer.applications', 'applications')
      .leftJoinAndSelect('applications.candidate', 'candidate')
      .leftJoinAndSelect('offer.requiredSkills', 'requiredSkills');

    // If user is a company, always filter by their company ID
    if (userCompanyId) {
      queryBuilder.andWhere('company.id = :userCompanyId', { userCompanyId });
    }

    // Apply additional filters
    if (recruiterId) {
      queryBuilder.andWhere('recruiter.id = :recruiterId', { recruiterId });
    }

    // companyId filter is redundant if userCompanyId is already applied
    if (companyId && !userCompanyId) {
      queryBuilder.andWhere('company.id = :companyId', { companyId });
    }

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    // Execute query
    const [offers, total] = await queryBuilder.getManyAndCount();

    return { offers, total };
  }

  // async findAllByCompanyId(companyId: string, paginationDto: PaginationDto) {
  //   const { limit = 15, offset = 0 } = paginationDto;
  //   const offers = await this.offerRepository.find({
  //     take: limit,
  //     skip: offset,
  //     where: { company: { id: companyId } },
  //     relations: {
  //       company: {
  //         user: true,
  //         industries: true
  //       },
  //       recruiter: {
  //         user: true,
  //       },
  //       modalityTypes: true,
  //       contractTypes: true,
  //       experienceLevels: true,
  //       workAreas: true,
  //       additionalBenefits: true,
  //     },
  //   });
  //   return { offers, total };
  // }

  async countAll(whereCondition?: FindOptionsWhere<Offer>) {
    return this.offerRepository.count({ where: whereCondition });
  }

  findOne(id: string) {
    return this.offerRepository.findOne({
      where: { id },
      relations: {
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
        applications: {
          candidate: {
            user: true,
          },
        },
      },
    });
  }
  //ToDo:
  findByCompany() {}

  async update(id: string, updateOfferDto: UpdateOfferDto, user: User) {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['company', 'recruiter'],
    });

    if (!offer) {
      throw new BadRequestException(`Offer with id ${id} not found`);
    }
    if (updateOfferDto.skill) {
      //Limpiar Array de Required Skills para volver a asignarlas
      offer.requiredSkills = [];
      // Obtener o crear las nuevas skills
      const newSkills = await this.skillsService.findOrCreate(
        updateOfferDto.skill,
      );
      // Inicializar el array de skills si no existe
      // Filtrar las skills que ya existen para no duplicarlas
      const skillsToAdd = newSkills.filter(
        (newSkill) =>
          !offer.requiredSkills.some(
            (existingSkill) => existingSkill.id === newSkill.id,
          ),
      );
      // Añadir solo las skills que no existían previamente
      offer.requiredSkills = [...offer.requiredSkills, ...skillsToAdd];
    }

    // Check if the user is a recruiter
    const recruiter = await this.recruitersService.findOneByUserId(user.id);
    if (recruiter) {
      // Check if the recruiter has permission to modify the offer
      const companiesForRecruiter =
        await this.recruitersService.getCompaniesForRecruiter(recruiter.id);
      const hasPermission = companiesForRecruiter.some(
        (company) => company.id === offer.company.id,
      );
      if (!hasPermission || offer.recruiter.id !== recruiter.id) {
        throw new UnauthorizedException(
          `Recruiter does not have permission to modify this offer`,
        );
      }
      // Allow recruiter to update the offer
      if (
        updateOfferDto.companyId &&
        updateOfferDto.companyId !== offer.company.id
      ) {
        const newCompany = await this.companiesService.findOne(
          updateOfferDto.companyId,
        );
        if (!newCompany) {
          throw new BadRequestException(
            `Company with id ${updateOfferDto.companyId} not found`,
          );
        }
        const hasNewCompanyPermission = companiesForRecruiter.some(
          (company) => company.id === newCompany.id,
        );
        if (!hasNewCompanyPermission) {
          throw new UnauthorizedException(
            `Recruiter does not have permission to assign this company to the offer`,
          );
        }
        offer.company = newCompany;
      }
    } else {
      // Check if the user is a company
      const company = await this.companiesService.findOneByUserId(user.id);
      if (!company || company.id !== offer.company.id) {
        throw new UnauthorizedException(
          `Company does not have permission to modify this offer`,
        );
      }
      // Company can update the offer
      if (
        updateOfferDto.companyId &&
        updateOfferDto.companyId !== offer.company.id
      ) {
        throw new UnauthorizedException(
          `Company cannot change the companyId of the offer`,
        );
      }
    }

    Object.assign(offer, updateOfferDto);
    return this.offerRepository.save(offer);
  }

  // Eliminar Offerta (Borrado Lógico)
  async remove(id: string, user: User) {
    const offer = await this.findOne(id);
    if (!offer) {
      throw new NotFoundException(`Offer with id ${id} not found`);
    }

    // console.log(offer);

    if (
      !(
        offer.company?.user_id === user.id ||
        offer.recruiter?.user_id === user.id
      )
    ) {
      throw new BadRequestException(
        `User with id ${user.id} is not allowed to delete this offer`,
      );
    }

    offer.deletedAt = new Date();

    return this.offerRepository.save(offer);
  }

  async findAllActiveWithRelations() {
    return this.offerRepository.find({
      where: {
        status: OfferStatus.published,
      },
      relations: {
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
        applications: {
          candidate: {
            user: true,
          },
        },
      },
    });
  }

  async apply(applicationDTO: ApplicationDto, user: User) {
    const offer = await this.findOne(applicationDTO.offerId);
    if (!offer) {
      throw new NotFoundException(
        `Offer with id ${applicationDTO.offerId} not found`,
      );
    }
    return this.applicationsService.apply(applicationDTO, user, offer);
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 10) {
    try {
      console.log(
        `getPersonalizedRecommendations called for userId: ${userId}, limit: ${limit}`,
      );

      // Get all active offers
      const offers = await this.findAllActiveWithRelations();

      if (!offers || offers.length === 0) {
        console.log('No offers found, returning empty array');
        return [];
      }

      console.log(
        `Found ${offers.length} active offers to process for recommendations`,
      );

      // Get personalized recommendations with scores
      const recommendations =
        await this.recommendationService.getPersonalizedRecommendations(
          userId,
          limit,
          offers,
        );

      console.log(
        `Recommendation service returned ${recommendations?.length || 0} recommendations`,
      );

      if (!recommendations || recommendations.length === 0) {
        console.log(
          'No recommendations returned, providing random fallback offers',
        );
        return offers.sort(() => Math.random() - 0.5).slice(0, limit);
      }

      // Create a map of recommendations by offerId for quick lookup
      const recommendationsMap = new Map(
        recommendations.map((rec) => [rec.offerId, rec]),
      );

      // Filter and sort offers based on recommendation scores
      const sortedOffers = offers
        .filter((offer) => recommendationsMap.has(offer.id))
        .map((offer) => {
          const recommendation = recommendationsMap.get(offer.id);
          return {
            ...offer,
            _score: recommendation.matchScore,
            _mlScore: recommendation.scoreDetails?.mlScore || 0.5,
            _heuristicScore: recommendation.scoreDetails?.heuristicScore || 0,
          };
        })
        .sort((a, b) => {
          // Primary sort by matchScore
          const scoreDiff = b._score - a._score;
          if (Math.abs(scoreDiff) > 0.1) {
            // Si hay una diferencia significativa en scores
            return scoreDiff;
          }

          // Secondary sort by ML score if match scores are close
          const mlScoreDiff = b._mlScore - a._mlScore;
          if (Math.abs(mlScoreDiff) > 0.1) {
            return mlScoreDiff;
          }

          // Finally sort by heuristic score
          return b._heuristicScore - a._heuristicScore;
        })
        .map((offer) => {
          // Remove temporary scoring properties
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _score, _mlScore, _heuristicScore, ...cleanOffer } = offer;
          return cleanOffer;
        })
        .slice(0, limit);

      console.log(`Final recommended offers count: ${sortedOffers.length}`);

      if (sortedOffers.length === 0) {
        console.log('After filtering got empty array, providing fallback');
        return offers.sort(() => Math.random() - 0.5).slice(0, limit);
      }

      return sortedOffers;
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);

      // Return random offers as fallback
      try {
        const fallbackOffers = await this.findAllActiveWithRelations();
        console.log(
          `Returning ${Math.min(limit, fallbackOffers.length)} random offers due to error`,
        );
        return fallbackOffers.sort(() => Math.random() - 0.5).slice(0, limit);
      } catch (fallbackError) {
        console.error('Failed to get fallback offers:', fallbackError);
        return [];
      }
    }
  }

  // Obtener Tags
  async findAllModalityType(): Promise<ModalityType[]> {
    return await this.modalityTypeRepository.find();
  }

  async findAllContractType(): Promise<ContractType[]> {
    return await this.contractTypeRepository.find();
  }
  async findAllExperienceLevel(): Promise<ExperienceLevel[]> {
    return await this.experienceLevelRepository.find();
  }
  async findAllWorkArea(): Promise<WorkArea[]> {
    return await this.workAreaRepository.find();
  }
  async findAllAdditionalBenefit(): Promise<AdditionalBenefit[]> {
    return await this.additionalBenefitRepository.find();
  }
}
