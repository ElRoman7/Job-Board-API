import { ArrayUnique, IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";
import { ValidRoles } from "../interfaces/valid-roles";

export class CreateUserDto {

    @IsEmail()
    email:string

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
      message:
        'The password must have a Uppercase, lowercase letter and a number',
    })
    password: string;

    @IsString()
    @MinLength(2)
    @MaxLength(70)
    fullname: string;

    @IsOptional()
    @IsPhoneNumber('MX', { message: 'El número debe ser válido para México' })
    @Length(10, 15, { message: 'El número debe tener entre 10 y 15 caracteres' })
    phoneNumber?: string;

    @IsOptional()
    @IsEnum(ValidRoles, { each: true, message: 'Each role must be a valid role: candidate, recruiter or company' })
    @ArrayUnique({ message: 'Roles must be unique' })
    roles?: string[];

}
