import { Company } from "src/companies/entities/company.entity";
import { User } from "../../users/entities/user.entity";
import { Column, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('recruiters')
@Unique(['user_id']) // Esto asegura que user_id sea único en la tabla
export class Recruiter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: true})
    contact_email: string;

    @Column({ type: 'text', nullable: true })
    specialization: string;
    
    //* Definir explícitamente la columna user_id para que sea parte de la entidad
    @Column({ type: 'uuid' })
    user_id: string; // Esta es la columna que será utilizada para la restricción de unicidad
  

    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Recruiter
    user: User;

    @ManyToMany(() => Company)
    @JoinTable()  // Esto crea una tabla intermedia que gestiona la relación
    companies: Company[];

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date; // Se llena cuando el registro es "eliminado"
}
