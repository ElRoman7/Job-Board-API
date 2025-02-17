import { IsNotEmpty, IsUUID } from "class-validator"

export class ActivateUserDto{

    @IsNotEmpty()
    @IsUUID('4')
    activationToken: string;
}