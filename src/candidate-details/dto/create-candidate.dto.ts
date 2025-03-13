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

  @IsString()
  city: string; // Ciudad

  @IsString()
  state: string; // Estado

  @IsString()
  country: string; // País

  @IsOptional()
  @IsUrl()
  @IsString()
  website: string; // Sitio web de la empresa

  //TODO
  //"aptitudes": string[],
}
