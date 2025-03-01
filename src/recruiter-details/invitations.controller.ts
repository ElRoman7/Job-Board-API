import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { EmailToCompanyRecruiterDTO } from './dto/email-company-recruiter.dto';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Auth(ValidRoles.company)
  @Post('send-invitation')
  async sendInvitationToRecruiter(
    @GetUser() user: User,
    @Body() emailToCompanyRecruiterDTO: EmailToCompanyRecruiterDTO,
  ) {
    return await this.invitationsService.SendInvitationToRecruiter(
      user,
      emailToCompanyRecruiterDTO.email,
    );
  }

  @Post('/:token')
  async addRecruiterToCompany(@Param('token', ParseUUIDPipe) token: string) {
    return await this.invitationsService.addRecruiterToCompany(token);
  }
}
