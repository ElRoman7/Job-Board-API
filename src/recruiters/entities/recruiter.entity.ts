import { Company } from "src/companies/entities/company.entity";
import { User } from "../../users/entities/user.entity";
import { Column, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export class Recruiter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: true})
    contact_email: string;

    @Column({ type: 'text', nullable: true })
    specialization: string;
    
    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Recruiter
    user: User;

    @ManyToMany(() => Company)
    @JoinTable()  // Esto crea una tabla intermedia que gestiona la relación
    companies: Company[];
}
