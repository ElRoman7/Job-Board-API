import {
  Controller,
  Body,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('job-applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // @Auth(ValidRoles.candidate)
  // @Post()
  // apply(@Body() applicationDto: ApplicationDto, @GetUser() user: User) {
  //   return this.applicationsService.apply(applicationDto, user);
  // }

  @Auth(ValidRoles.candidate)
  @Get('')
  getApplicationsByUser(@GetUser() user: User) {
    return this.applicationsService.getApplicationsByUser(user.id);
  }

  @Auth(ValidRoles.company)
  @Get('total')
  getTotalApplications(@GetUser() user: User) {
    return this.applicationsService.getTotalApplications(user);
  }

  @Auth(ValidRoles.company)
  @Patch(':id')
  updateJobApplyStatus(
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { status } = updateApplicationDto;
    return this.applicationsService.updateApplicationStatus(id, status);
  }
}
