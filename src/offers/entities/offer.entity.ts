import { User } from 'src/users/entities/user.entity';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

@Entity('offers')
export class Offer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar' })
    status: 'draft' | 'published' | 'closed';

    //ToDo: Relacion con el id de la empresa
    //ToDo: Categorizar
    // Relaciones con un reclutador (Creador de la Oferta)
    @ManyToOne(() => User, (user) => user.offer, {eager: true})
    user: User

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at?: Date;
}
