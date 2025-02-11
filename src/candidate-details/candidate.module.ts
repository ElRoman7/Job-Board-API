import { Module } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { Candidate } from './entities/candidate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [CandidateController],
  providers: [CandidateService],
  imports:[TypeOrmModule.forFeature([Candidate]), UsersModule, CommonModule, MailModule],
  exports: [CandidateService, TypeOrmModule]
})
export class CandidateModule {}
