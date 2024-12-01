import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email:string

    @Column()
    password: string;
  
    @Column()
    fullname: string;
  
    @Column({ type: 'varchar' })
    type: 'candidate' | 'recruiter' | 'company';

    @Column('simple-array') // Guarda los roles como un array de strings
    roles: string[];
  
    @Column({ default: true })
    is_active: boolean;
    // Relaciones con recruiter y company

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
  
    @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}