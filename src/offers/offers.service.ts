import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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

  async create(createOfferDto: CreateOfferDto, userId: string) {
    const { companyId, modalityTypes, contractTypes, experienceLevels, workAreas, additionalBenefits, ...rest } = createOfferDto;
    
    // Buscar la compañía asociada al usuario
    const company = await this.companiesService.findOneByUserId(userId);
    
    // Validar que el companyId coincida con el de la compañía del usuario
    if (company.id !== companyId) {
        throw new UnauthorizedException(`Company with id ${companyId} does not match with the company of the user`);
    }
    
    // Buscar el reclutador asociado al usuario
    const recruiter = await this.recruitersService.findOneByUserId(userId);

    // Si el reclutador no existe, creamos la oferta solo si es la misma compañía del usuario
    if (!recruiter) {
        const offer = this.offerRepository.create({
            company,
            modalityTypes,  // Aquí se mapea directamente
            contractTypes,  // Aquí se mapea directamente
            experienceLevels, // Aquí se mapea directamente
            workAreas,  // Aquí se mapea directamente
            additionalBenefits, // Aquí se mapea directamente
            ...rest
        });
        return this.offerRepository.save(offer);
    }

    // Si el reclutador existe, verificamos si tiene permisos para crear ofertas para esta compañía
    const companiesForRecruiter = await this.recruitersService.getCompaniesForRecruiter(recruiter.id);
    const hasPermission = companiesForRecruiter.some(company => company.id === companyId);
    
    if (!hasPermission) {
        throw new UnauthorizedException(`Recruiter does not have permission to publish offers for company with id ${companyId}`);
    }

    // Mapear las relaciones para asignarlas correctamente a la oferta
    const modalityInstances = await this.modalityTypeRepository.findBy({
      id: In(modalityTypes.map(modality => modality.id))
    });
    const contractInstances = await this.contractTypeRepository.findBy({
      id: In(contractTypes.map(contract => contract.id))
    });
    const experienceInstances = await this.experienceLevelRepository.findBy({
      id: In(experienceLevels.map(experience => experience.id))
    });
    const workAreaInstances = await this.workAreaRepository.findBy({
      id: In(workAreas.map(workArea => workArea.id))
    });
    const additionalBenefitInstances = await this.additionalBenefitRepository.findBy({
      id: In(additionalBenefits.map(benefit => benefit.id))
    });


    // Crear la oferta con las relaciones mapeadas
    const offer = this.offerRepository.create({
        company,
        recruiter,
        modalityTypes: modalityInstances,
        contractTypes: contractInstances,
        experienceLevels: experienceInstances,
        workAreas: workAreaInstances,
        additionalBenefits: additionalBenefitInstances,
        ...rest
    });
    
    return this.offerRepository.save(offer);
}


async findAll(paginationDto: PaginationDto) {
  const { limit = 10, offset = 0 } = paginationDto;

  const offers = await this.offerRepository.find({
      take: limit,
      skip: offset,
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

  const total = await this.countAll(); // Suponiendo que tienes un método para contar todas las ofertas
  return { offers, total };
}


  async countAll() {
    return this.offerRepository.count();
  }
  //ToDo:
  findOne(id: number) {
    return `This action returns a #${id} offer`;
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

  remove(id: number) {
    return `This action removes a #${id} offer`;
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
