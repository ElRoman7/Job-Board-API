import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersModule } from 'src/offers/offers.module';
import { CompaniesModule } from 'src/company-details/companies.module';
import { RecruitersModule } from 'src/recruiter-details/recruiters.module';
import { ApplicationsModule } from 'src/job-applications/applications.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CandidateModule } from './candidate-details/candidate.module';
import { NotificationsWsModule } from './notifications-ws/notifications-ws.module';
import { SkillsModule } from './skills/skills.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      ssl: process.env.STAGE === 'prod' ? true : false,
      extra: {
        ssl:
          process.env.STAGE === 'prod' ? { rejectUnauthorized: false } : null,
      },
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true,
    }),
    OffersModule,
    CompaniesModule,
    RecruitersModule,
    ApplicationsModule,
    AuthModule,
    UsersModule,
    MailModule,
    CloudinaryModule,
    CandidateModule,
    NotificationsWsModule,
    SkillsModule,
  ],
})
export class AppModule {}
