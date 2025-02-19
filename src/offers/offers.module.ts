import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { AuthModule } from '../auth/auth.module';
import { RecruitersModule } from 'src/recruiter-details/recruiters.module';
import { CompaniesModule } from 'src/company-details/companies.module';
import { CommonModule } from 'src/common/common.module';
import { SeedService } from './seed.service';
import { AdditionalBenefit, ContractType, ExperienceLevel, ModalityType, WorkArea } from './entities/tags.entity';

@Module({
  controllers: [OffersController],
  providers: [OffersService, SeedService],
  imports: [TypeOrmModule.forFeature([Offer, ModalityType, ContractType, ExperienceLevel, WorkArea, AdditionalBenefit]), AuthModule, RecruitersModule, CompaniesModule, CommonModule],
  exports: [TypeOrmModule, OffersService, SeedService]
})
export class OffersModule {}
