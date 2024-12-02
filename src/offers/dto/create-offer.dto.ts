import { IsDate, IsString, MinLength } from "class-validator";

export class CreateOfferDto {
    @IsString()
    @MinLength(10)
    title: string;

    @IsString()
    @MinLength(20)
    description: string;

    @IsString()
    status: 'draft' | 'published' | 'closed';

    @IsDate()
    created_at: Date;

    updated_at?: Date;

}
