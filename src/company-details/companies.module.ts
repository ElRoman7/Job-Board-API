import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
  imports: [TypeOrmModule.forFeature([Company]), CommonModule, UsersModule],
  exports: [TypeOrmModule, CompaniesService]
})
export class CompaniesModule {}
