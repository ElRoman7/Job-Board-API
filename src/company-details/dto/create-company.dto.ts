import { IsString, IsOptional, IsUUID, IsEmail } from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    city?: string;

    @IsString()
    state?: string;

    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    description?: string;

    // ToDo 
    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    @IsEmail()
    contact_email?: string;

    // @IsUUID()
    // user_id: string; // Esta es la columna que será utilizada para la restricción de unicidad
}
