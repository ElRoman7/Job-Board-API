import { Recruiter } from "src/recruiters/entities/recruiter.entity";
import { User } from "../../users/entities/user.entity";
import { ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, ManyToMany, Entity, Unique } from "typeorm";

@Entity('companies')
@Unique(['user_id']) // Esto asegura que user_id sea único en la tabla
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column('text', {nullable: true})
    address: string; // Dirección física

    @Column('text')
    city: string; // Ciudad

    @Column('text')
    state: string; // Estado

    @Column('text')
    country: string; // País

    @Column('text', { nullable: true })
    website: string; // Sitio web de la empresa

    @Column('text', { nullable: true })
    description: string; // Descripción de la empresa

    @Column('text', { nullable: true })
    industry: string; // Industria

    @Column('text', { nullable: true })
    contact_email: string; // Correo electrónico de contacto

    //* Definir explícitamente la columna user_id para que sea parte de la entidad
    @Column({ type: 'uuid' })
    user_id: string; // Esta es la columna que será utilizada para la restricción de unicidad

    
    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Company
    user: User;

    // * Tabla pivote para reclutadores y empresa
    @ManyToMany(() => Recruiter, (recruiter) => recruiter.companies)
    recruiters: Recruiter[];

}
