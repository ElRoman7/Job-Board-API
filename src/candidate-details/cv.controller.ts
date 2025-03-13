import { Controller, Post, Body } from '@nestjs/common';
import { CvService } from './services/cv.service';
import { CvEntity } from './entities/cv.entity';
import { Auth, GetUser } from 'src/auth/decorators';
import { ValidRoles } from 'src/users/interfaces/valid-roles';
import { User } from 'src/users/entities/user.entity';

@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Auth(ValidRoles.candidate)
  @Post('process')
  async procesarCV(
    @Body('cvTexto') cvTexto: string,
    @GetUser() user: User,
  ): Promise<CvEntity> {
    return this.cvService.procesarCV(cvTexto, user);
  }
}
