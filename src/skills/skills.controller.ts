import { Controller, Get} from '@nestjs/common';
import { SkillsService } from './skills.service';
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  getSkills() {
    return this.skillsService.getSkills();
  }

}
