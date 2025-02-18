import { IsString, IsOptional, IsEmail } from 'class-validator';

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

    // ToDo: Preparar industrias para que sean seleccionadas de un catálogo
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
