import { Recruiter } from "src/recruiters/entities/recruiter.entity";
import { User } from "../../users/entities/user.entity";
import { ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";

export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column('text')
    address: string; // Dirección física

    @Column('text', { nullable: true })
    city: string; // Ciudad

    @Column('text', { nullable: true })
    state: string; // Estado

    @Column('text', { nullable: true })
    country: string; // País

    @Column('text', { nullable: true })
    website: string; // Sitio web de la empresa

    @Column('text', { nullable: true })
    description: string; // Descripción de la empresa

    @Column('text', { nullable: true })
    industry: string; // Industria

    @Column('text', { nullable: true })
    contact_email: string; // Correo electrónico de contacto
    
    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Company
    user: User;

    // * Tabla pivote para reclutadores y empresa
    @ManyToMany(() => Recruiter, (recruiter) => recruiter.companies)
    recruiters: Recruiter[];

}
