import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCandidateDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  cvUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @Transform(({ value }) => (value === '' ? undefined : value))
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @Transform(({ value }) => (value === '' ? undefined : value))
  portfolioUrl?: string;

  @IsString()
  city: string; // Ciudad

  @IsString()
  state: string; // Estado

  @IsString()
  country: string; // País

  @IsOptional()
  @IsString()
  @IsUrl()
  @Transform(({ value }) => (value === '' ? undefined : value))
  website?: string; // Sitio web de la empresa

  //TODO
  //"aptitudes": string[],
}
