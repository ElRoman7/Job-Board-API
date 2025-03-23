import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { Candidate } from './entities/candidate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { CandidateService } from './services/candidate.service';
import { CvEntity } from './entities/cv.entity';
import { CvService } from './services/cv.service';
import { CvController } from './cv.controller';
import { AuthModule } from 'src/auth/auth.module';
import { SkillsModule } from 'src/skills/skills.module';

@Module({
  controllers: [CandidateController, CvController],
  providers: [CandidateService, CvService],
  imports: [
    TypeOrmModule.forFeature([Candidate, CvEntity]),
    UsersModule,
    CommonModule,
    MailModule,
    AuthModule,
    SkillsModule,
  ],
  exports: [CandidateService, TypeOrmModule, CvService],
})
export class CandidateModule {}
