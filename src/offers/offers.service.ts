import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompaniesService } from 'src/company-details/companies.service';
import { RecruitersService } from 'src/recruiter-details/recruiters.service';
import { Offer } from './entities/offer.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { User } from 'src/users/entities/user.entity';
import { ErrorHandlerService } from 'src/common/error-handler.service';

@Injectable()
export class OffersService {

  constructor( 
    @InjectRepository(Offer)
    private readonly offerRepository : Repository<Offer>,
    private readonly companiesService: CompaniesService,
    private readonly recruitersService: RecruitersService,
    private readonly errorHandlerService: ErrorHandlerService

  ){}

  async create(createOfferDto: CreateOfferDto, userId: string) {
    const { companyId, ...rest } = createOfferDto;
    const company = await this.companiesService.findOneByUserId(userId);
    if(company.id != companyId){
      throw new UnauthorizedException(`Company with id ${companyId} does not match with the company of the user`);
    }
    const recruiter = await this.recruitersService.findOneByUserId(userId);
    console.log(recruiter);
    
    //* La oferta está siendo creada por una compañía
    if (!recruiter) {
      if (company.id !== companyId) {
        throw new UnauthorizedException(`Company with id ${companyId} does not match with the company of the user`);
      }
      console.log('aqui');
      
      const offer = this.offerRepository.create({
      company,
      ...rest
      });
      return this.offerRepository.save(offer);
    }
    const companiesForRecruiter = await this.recruitersService.getCompaniesForRecruiter(recruiter.id);
    const hasPermission = companiesForRecruiter.some(company => company.id === companyId);
    if (!hasPermission) {
      throw new UnauthorizedException(`Recruiter does not have permission to publish offers for company with id ${companyId}`);
    }

    const offer = this.offerRepository.create({
      company,
      recruiter,
      ...rest
    })
    return this.offerRepository.save(offer)
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    const offers = await this.offerRepository.find({
      take: limit,
      skip: offset,
      relations: {
        company: {
          user: true
        },
        recruiter: {
          user: true
        }
      }
    })
    const total = await this.countAll();
    return { offers, total }
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
}
