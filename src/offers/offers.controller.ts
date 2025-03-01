import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, Delete } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Auth, GetUser } from '../auth/decorators';
import { ValidRoles } from '../users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,  
  ) {}

  @Auth(ValidRoles.recruiter, ValidRoles.company)
  @Post()
  create(@Body() createOfferDto: CreateOfferDto, @GetUser() user: User) {
    return this.offersService.create(createOfferDto, user);
  }
  
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.offersService.findAll(paginationDto);
  }
  @Get('/modality-types')
  findAllModalityTypes(){
    return this.offersService.findAllModalityType();
  }

  @Get('/contract-types')
  findAllContractTypes(){
    return this.offersService.findAllContractType();
  }

  @Get('/experience-levels')
  findAllExperienceLevels(){
    return this.offersService.findAllExperienceLevel();
  }

  @Get('/work-areas')
  findAllWorkAreas(){
    return this.offersService.findAllWorkArea();
  }

  @Get('/additional-benefits')
  findAllAdditionalBenefits(){
    return this.offersService.findAllAdditionalBenefit();
  }

  //Get Offers By company or recruiters
  @Auth(ValidRoles.company, ValidRoles.recruiter)
  @Get('/company')
  findAllByCompanyId(@GetUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.offersService.findAllByCompany(user, paginationDto);
  }

  // @Auth(ValidRoles.company, ValidRoles.recruiter)
  // @Get('/:companyId')
  // findAllByCompanyId(@Param('companyId', ParseUUIDPipe) companyId: string, @Query() paginationDto: PaginationDto) {
  //   return this.offersService.findAllByCompanyId(companyId, paginationDto);
  // }



  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Auth(ValidRoles.recruiter, ValidRoles.company)
  @Get('/company/:id')
  findAllByCompany(@Param('id', ParseUUIDPipe) companyId: string){
    return companyId;
  }

  @Auth(ValidRoles.recruiter, ValidRoles.company)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateOfferDto: UpdateOfferDto, @GetUser() user: User) {
    return this.offersService.update(id, updateOfferDto, user);
  }

  @Auth(ValidRoles.recruiter, ValidRoles.company)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.offersService.remove(id, user);
  }
}
