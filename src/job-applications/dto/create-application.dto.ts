import { IsUUID, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ApplicationDto {
    @IsUUID()
    @IsNotEmpty()
    offerId: string;

    @IsString()
    @MaxLength(400)
    @IsOptional()
    coverLetter?: string;
}
