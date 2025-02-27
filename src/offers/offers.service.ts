import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CompaniesService } from 'src/company-details/companies.service';
import { RecruitersService } from 'src/recruiter-details/recruiters.service';
import { Offer } from './entities/offer.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { User } from 'src/users/entities/user.entity';
import { ErrorHandlerService } from 'src/common/error-handler.service';
import { ModalityType, ContractType, ExperienceLevel, WorkArea, AdditionalBenefit } from './entities/tags.entity';

@Injectable()
export class OffersService {

  constructor( 
    @InjectRepository(Offer)
    private readonly offerRepository : Repository<Offer>,
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
    private readonly additionalBenefitRepository: Repository<AdditionalBenefit>

  ){}

  async create(createOfferDto: CreateOfferDto, user: User) {
    const { companyId, ...rest } = createOfferDto;

    // Obtener entidades relacionadas
    const relatedEntities = await this.getRelatedEntities(createOfferDto);

    // Si el usuario es reclutador, validar permisos
    if (user.roles.includes('recruiter')) {
        const recruiter = await this.recruitersService.findOneByUserId(user.id);
        if (!recruiter) throw new UnauthorizedException(`Recruiter not found`);

        const company = await this.companiesService.findOne(companyId);
        await this.validateRecruiterPermissions(recruiter.id, companyId);

        return this.saveOffer({ company, recruiter, ...relatedEntities, ...rest });
    }

    // Si el usuario no es reclutador, validar su compañía
    const company = await this.validateCompanyForUser(user.id, companyId);
    return this.saveOffer({ company, recruiter: null, ...relatedEntities, ...rest });
  }

  // Obtener entidades relacionadas
  private async getRelatedEntities(createOfferDto: CreateOfferDto) {
      const { modalityTypes, contractTypes, experienceLevels, workAreas, additionalBenefits } = createOfferDto;

      return {
          modalityTypes: await this.modalityTypeRepository.findBy({ id: In(modalityTypes.map(m => m.id)) }),
          contractTypes: await this.contractTypeRepository.findBy({ id: In(contractTypes.map(c => c.id)) }),
          experienceLevels: await this.experienceLevelRepository.findBy({ id: In(experienceLevels.map(e => e.id)) }),
          workAreas: await this.workAreaRepository.findBy({ id: In(workAreas.map(w => w.id)) }),
          additionalBenefits: await this.additionalBenefitRepository.findBy({ id: In(additionalBenefits.map(b => b.id)) }),
      };
  }

  // Validar permisos del reclutador
  private async validateRecruiterPermissions(recruiterId: string, companyId: string) {
      const companiesForRecruiter = await this.recruitersService.getCompaniesForRecruiter(recruiterId);
      if (!companiesForRecruiter.some(company => company.id === companyId)) {
          throw new UnauthorizedException(`Recruiter does not have permission to publish offers for company ${companyId}`);
      }
  }

  // Validar que la compañía pertenece al usuario
  private async validateCompanyForUser(userId: string, companyId: string) {
      const company = await this.companiesService.findOneByUserId(userId);
      if (!company) throw new BadRequestException(`Company with user_id ${userId} not found`);
      if (company.id !== companyId) {
          throw new UnauthorizedException(`Company with id ${companyId} does not match with the company of the user`);
      }
      return company;
  }

  // Guardar la oferta en la base de datos
  private saveOffer(data: Partial<Offer>) {
      const offer = this.offerRepository.create(data);
      return this.offerRepository.save(offer);
  }


  async findAll(paginationDto: PaginationDto) {
    const { limit = 15, offset = 0 , recruiterId} = paginationDto;

    const whereCondition: any = {};

    if (recruiterId) {
      whereCondition.recruiter = { id: recruiterId };
    }
    const offers = await this.offerRepository.find({
        take: limit,
        skip: offset,
        where: whereCondition,
        relations: {
            company: {
                user: true, // Relación con usuario de la compañía
                industries: true // Relación con industrias
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
    });
    console.log(offers);

    let total = 0
    if(recruiterId){
      total = offers.length
    }else{
      total = await this.countAll(); // Suponiendo que tienes un método para contar todas las ofertas
    }
    return { offers, total, recruiterId };
  }

  async findAllByCompany(user: User, paginationDto: PaginationDto) {
    const { limit = 15, offset = 0, recruiterId } = paginationDto;

    const whereCondition: any = { };

    if(user.roles[0] == 'company'){
      whereCondition.company = { user_id: user.id };
    }
  
 
  
    if (recruiterId) {
      whereCondition.recruiter = { id: recruiterId };
    }
  
    const offers = await this.offerRepository.find({
      take: limit,
      skip: offset,
      where: whereCondition,
      relations: {
        company: {
          user: true,
          industries: true,
        },
        recruiter: {
          user: true,
        },
        modalityTypes: true,
        contractTypes: true,
        experienceLevels: true,
        workAreas: true,
        additionalBenefits: true,
      },
    });
    let total = 0
    if(recruiterId){
      total = offers.length
    }else{
      total = await this.countAll(); // Suponiendo que tienes un método para contar todas las ofertas
    }
    console.log('Filter conditions:', whereCondition);


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

  async countAll() {
      return this.offerRepository.count();
  }

  findOne(id: string) {
    return this.offerRepository.findOne(
      {where: {id}, 
      relations: {
        company: {
            user: true, // Relación con usuario de la compañía
            industries: true // Relación con industrias
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
    }
      
    );
  }
  //ToDo:
  findByCompany(){

  }

  async update(id: string, updateOfferDto: UpdateOfferDto, user: User) {
    const offer = await this.offerRepository.findOne({ where: { id }, relations: ['company', 'recruiter'] });

    if (!offer) {
      throw new BadRequestException(`Offer with id ${id} not found`);
    }

    // Check if the user is a recruiter
    const recruiter = await this.recruitersService.findOneByUserId(user.id);
    if (recruiter) {
      // Check if the recruiter has permission to modify the offer
      const companiesForRecruiter = await this.recruitersService.getCompaniesForRecruiter(recruiter.id);
      const hasPermission = companiesForRecruiter.some(company => company.id === offer.company.id);
      if (!hasPermission || offer.recruiter.id !== recruiter.id) {
      throw new UnauthorizedException(`Recruiter does not have permission to modify this offer`);
      }
      // Allow recruiter to update the offer
      if (updateOfferDto.companyId && updateOfferDto.companyId !== offer.company.id) {
      const newCompany = await this.companiesService.findOne(updateOfferDto.companyId);
      if (!newCompany) {
        throw new BadRequestException(`Company with id ${updateOfferDto.companyId} not found`);
      }
      const hasNewCompanyPermission = companiesForRecruiter.some(company => company.id === newCompany.id);
      if (!hasNewCompanyPermission) {
        throw new UnauthorizedException(`Recruiter does not have permission to assign this company to the offer`);
      }
      offer.company = newCompany;
      }
    } else {
      // Check if the user is a company
      const company = await this.companiesService.findOneByUserId(user.id);
      if (!company || company.id !== offer.company.id) {
      throw new UnauthorizedException(`Company does not have permission to modify this offer`);
      }
      // Company can update the offer
      if (updateOfferDto.companyId && updateOfferDto.companyId !== offer.company.id) {
      throw new UnauthorizedException(`Company cannot change the companyId of the offer`);
      }
    }

    Object.assign(offer, updateOfferDto);
    return this.offerRepository.save(offer);
  }

  // Eliminar Offerta (Borrado Lógico)
  async remove(id : string, user: User){

    const offer = await this.findOne(id);
    if(!offer){
      throw new NotFoundException(`Offer with id ${id} not found`)
    }
    
    // console.log(offer);
    

    if (!(offer.company?.user_id === user.id || offer.recruiter?.user_id === user.id)) {
      throw new BadRequestException(`User with id ${user.id} is not allowed to delete this offer`);
    }
    

    offer.deletedAt = new Date();

    return this.offerRepository.save(offer)
  }

  // Obtener Tags
  async findAllModalityType() : Promise<ModalityType[]> {
    return await this.modalityTypeRepository.find();
  }

  async findAllContractType() : Promise<ContractType[]> {
    return await this.contractTypeRepository.find();
  }
  async findAllExperienceLevel() : Promise<ExperienceLevel[]> {
    return await this.experienceLevelRepository.find();
  }
  async findAllWorkArea() : Promise<WorkArea[]> {
    return await this.workAreaRepository.find();
  }
  async findAllAdditionalBenefit() : Promise<AdditionalBenefit[]> {
    return await this.additionalBenefitRepository.find();
  }

}
