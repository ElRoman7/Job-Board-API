import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';
import { CandidateModule } from 'src/candidate-details/candidate.module';
import { NotificationsWsModule } from 'src/notifications-ws/notifications-ws.module';

@Module({
  controllers: [ApplicationsController],
  imports: [
    TypeOrmModule.forFeature([Application]),
    AuthModule,
    CommonModule,
    CandidateModule,
    NotificationsWsModule,
  ],
  providers: [ApplicationsService],
  exports: [TypeOrmModule, ApplicationsService],
})
export class ApplicationsModule {}
