import { Controller, Post, Body} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationDto } from './dto/create-application.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';

@Controller('job-applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Auth(ValidRoles.candidate)
  @Post()
  apply(@Body() applicationDto: ApplicationDto, @GetUser() user: User) {
    return this.applicationsService.apply(applicationDto, user);
  }

}
