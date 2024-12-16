import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { AuthModule } from '../auth/auth.module';
import { RecruitersModule } from 'src/recruiters/recruiters.module';
import { CompaniesModule } from 'src/companies/companies.module';

@Module({
  controllers: [OffersController],
  providers: [OffersService],
  imports: [TypeOrmModule.forFeature([Offer]), AuthModule, RecruitersModule, CompaniesModule],
  exports: [TypeOrmModule, OffersService]
})
export class OffersModule {}
