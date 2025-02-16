import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { AuthModule } from '../auth/auth.module';
import { RecruitersModule } from 'src/recruiter-details/recruiters.module';
import { CompaniesModule } from 'src/company-details/companies.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [OffersController],
  providers: [OffersService],
  imports: [TypeOrmModule.forFeature([Offer]), AuthModule, RecruitersModule, CompaniesModule, CommonModule],
  exports: [TypeOrmModule, OffersService]
})
export class OffersModule {}
