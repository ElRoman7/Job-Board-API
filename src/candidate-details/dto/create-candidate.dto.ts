import { IsOptional, IsString, IsUrl } from "class-validator";

export class CreateCandidateDto {
    @IsOptional()
    @IsString()
    @IsUrl()
    cvUrl?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    linkedinUrl?: string;

    @IsOptional()
    @IsString()
    @IsUrl()
    portfolioUrl?: string;
}
