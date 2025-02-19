import { IsString, IsOptional, IsEmail, IsArray, IsInt } from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    country: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsArray()
    @IsInt({ each: true })
    industries: string[];  // IDs de las industrias a asociar

    @IsOptional()
    @IsString()
    @IsEmail()
    contact_email?: string;

    // @IsUUID()
    // user_id: string; // Esta es la columna que será utilizada para la restricción de unicidad
}
