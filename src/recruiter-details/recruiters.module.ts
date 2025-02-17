import { Module } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { RecruitersController } from './recruiters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recruiter } from './entities/recruiter.entity';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { AuthModule } from 'src/auth/auth.module';
import { CompaniesModule } from 'src/company-details/companies.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [RecruitersController],
  providers: [RecruitersService],
  imports: [TypeOrmModule.forFeature([Recruiter]), UsersModule, CommonModule, CompaniesModule, AuthModule, MailModule],
  exports: [TypeOrmModule, RecruitersService]
})
export class RecruitersModule {}
