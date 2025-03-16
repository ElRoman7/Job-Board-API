import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ValidJobApplicationStatus } from '../interfaces/ValidStatus';

export class ApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  offerId: string;

  @IsString()
  @MaxLength(400)
  @IsOptional()
  coverLetter?: string;

  @IsEnum(ValidJobApplicationStatus)
  @IsOptional()
  status?: string;
}
