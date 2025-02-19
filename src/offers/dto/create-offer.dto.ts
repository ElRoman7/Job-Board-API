import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID, MinLength } from "class-validator";
import { OfferStatus } from "../interfaces/valid-status";
import { ModalityType, ContractType, ExperienceLevel, WorkArea, AdditionalBenefit } from "../entities/tags.entity";

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

    @IsArray()
    @IsNotEmpty()
    modalityTypes: ModalityType[];

    @IsArray()
    @IsNotEmpty()
    contractTypes: ContractType[];

    @IsArray()
    @IsNotEmpty()
    experienceLevels: ExperienceLevel[];

    @IsArray()
    @IsNotEmpty()
    workAreas: WorkArea[];

    @IsArray()
    @IsNotEmpty()
    additionalBenefits: AdditionalBenefit[];

}
