import { IsNotEmpty, Length } from "class-validator";

export class ChangePasswordDto {
    @IsNotEmpty()
    @Length(6,30)
    oldPassword: string;
    @IsNotEmpty()
    @Length(6,30)
    newPassword: string;
}