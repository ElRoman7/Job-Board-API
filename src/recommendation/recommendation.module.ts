import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JobRecommenderModel } from './job-recommender.model';
import { SkillsModule } from '../skills/skills.module';
import { CandidateModule } from 'src/candidate-details/candidate.module';
import { ApplicationsModule } from 'src/job-applications/applications.module';
import { RecommendationController } from './recommendation.controller';  // Add this import
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    SkillsModule,
    AuthModule,
    CandidateModule,
    ApplicationsModule,
  ],
  controllers: [RecommendationController],  // Add this line to register the controller
  providers: [RecommendationService, JobRecommenderModel],
  exports: [RecommendationService],
})
export class RecommendationModule {}
