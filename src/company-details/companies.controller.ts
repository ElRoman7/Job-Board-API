import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body('company') createCompanyDto: CreateCompanyDto, @Body('user') createUserDto: CreateUserDto) {
    return this.companiesService.create(createCompanyDto, createUserDto);
  }

  @Get('industries')
  getIndustries() {
    return this.companiesService.getIndustries();
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get('user/:id')
  findCompanyByUserId(@Param('id') id: string) {
    return this.companiesService.findOneByUserId(id)  
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
  //   return this.companiesService.update(+id, updateCompanyDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.companiesService.remove(+id);
  // }

}
