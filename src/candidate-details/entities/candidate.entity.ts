import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('candidate_details')
@Unique(['user_id']) // Esto asegura que user_id sea único en la tabla
export class Candidate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    cvUrl: string;

    @Column({ nullable: true })
    linkedinUrl: string;

    @Column({ nullable: true })
    portfolioUrl: string;

    //* Definir explícitamente la columna user_id para que sea parte de la entidad
    @Column({ type: 'uuid' })
    user_id: string;

    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Recruiter
    user: User;
}
