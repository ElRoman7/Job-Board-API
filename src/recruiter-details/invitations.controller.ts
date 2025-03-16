import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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

  @Auth(ValidRoles.recruiter)
  @Get('')
  async getInvitationsByUser(@GetUser() user: User) {
    return await this.invitationsService.getInvitationsByRecruiter(user);
  }

  @Auth(ValidRoles.recruiter)
  @Post(':id/:response')
  async setInvitationResponse(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('response') response: string,
  ) {
    if (!['accept', 'reject'].includes(response)) {
      throw new BadRequestException(
        'Invalid response. Must be "accept" or "reject".',
      );
    }
    return await this.invitationsService.setInvitationResponse(
      user,
      id,
      response as 'accept' | 'reject',
    );
  }
}
