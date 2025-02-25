import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CommonModule } from '../common/common.module';
import { MailModule } from 'src/mail/mail.module';
import { AuthModule } from 'src/auth/auth.module';
import { Invitation } from 'src/recruiter-details/entities/invitations.entity';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports:[TypeOrmModule.forFeature([User, Invitation]), forwardRef(() => AuthModule) ,CommonModule, MailModule],
  exports:[TypeOrmModule, UsersService]
})
export class UsersModule {}
