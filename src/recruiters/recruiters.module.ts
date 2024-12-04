import { Module } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { RecruitersController } from './recruiters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recruiter } from './entities/recruiter.entity';

@Module({
  controllers: [RecruitersController],
  providers: [RecruitersService],
  imports: [TypeOrmModule.forFeature([Recruiter])],
  exports: [TypeOrmModule, RecruitersService]
})
export class RecruitersModule {}
