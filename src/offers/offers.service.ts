import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompaniesService } from 'src/companies/companies.service';
import { RecruitersService } from 'src/recruiters/recruiters.service';
import { Offer } from './entities/offer.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class OffersService {

  constructor( 
    @InjectRepository(Offer)
    private readonly offerRepository : Repository<Offer>,
    private readonly companiesService: CompaniesService,
    private readonly recruitersService: RecruitersService

  ){}

  async create(createOfferDto: CreateOfferDto, userId: string) {
    const { companyId, ...rest } = createOfferDto;

    const company = await this.companiesService.findOne(companyId);
    const recruiter = await this.recruitersService.findOneByUserId(userId);
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
        company: true,
        recruiter: true
      }
    })

    return offers;
  }

  findOne(id: number) {
    return `This action returns a #${id} offer`;
  }

  findByCompany(){

  }

  update(id: number, updateOfferDto: UpdateOfferDto) {
    return `This action updates a #${id} offer`;
  }

  remove(id: number) {
    return `This action removes a #${id} offer`;
  }
}
