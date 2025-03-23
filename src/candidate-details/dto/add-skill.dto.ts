import { IsString } from "class-validator";

export class AddSkillDto{
    @IsString()
    skill: string[];
}