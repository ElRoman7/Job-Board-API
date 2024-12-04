import { User } from "../../users/entities/user.entity";
import { ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column } from "typeorm";

export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    address: string;
    
    //* Relación con User (FK user_id)
    @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK en Company
    user: User;

}
