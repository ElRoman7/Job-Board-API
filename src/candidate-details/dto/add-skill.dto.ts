import { IsArray } from 'class-validator';

export class AddSkillDto {
  @IsArray()
  skill: string[];
}
