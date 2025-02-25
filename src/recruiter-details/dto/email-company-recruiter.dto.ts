import { IsEmail } from "class-validator";

export class EmailToCompanyRecruiterDTO {
    @IsEmail()
    email: string
}