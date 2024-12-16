import { IsEnum, IsString, IsUUID, MinLength } from "class-validator";
import { OfferStatus } from "../interfaces/valid-status";

export class CreateOfferDto {
    @IsString()
    @MinLength(10)
    title: string;

    @IsString()
    @MinLength(20)
    description: string;

    @IsString()
    @IsEnum(OfferStatus)
    status: OfferStatus;

    @IsUUID()
    companyId: string;

}
