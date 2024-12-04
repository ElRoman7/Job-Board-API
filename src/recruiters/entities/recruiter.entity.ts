import { User } from "../../users/entities/user.entity";
import { JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export class Recruiter {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Recruiter
    user: User;
}
