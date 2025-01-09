import { IsEmail, IsOptional, IsPhoneNumber, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";

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
    name: string;

    @IsOptional()
    @IsPhoneNumber('MX', { message: 'El número debe ser válido para México' })
    @Length(10, 15, { message: 'El número debe tener entre 10 y 15 caracteres' })
    phoneNumber?: string;

}
