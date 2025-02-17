import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateRecruiterDto {
    @IsString()
    @IsEmail()
    @IsOptional()
    contact_email: string

    @IsString()
    @MinLength(3)
    @MaxLength(80)
    specialization: string;
}
