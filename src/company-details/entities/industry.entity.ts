import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Company } from "./company.entity";

@Entity('industries')
export class Industry {
    @PrimaryGeneratedColumn()
    id: string;
  
    @Column('text')
    name: string;
  
    @ManyToMany(() => Company, (company) => company.industries)
    companies: Company[];
}