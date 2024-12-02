import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('offers')
export class Offer {
    @PrimaryGeneratedColumn('uuid')
    id: string;
s
    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar' })
    status: 'draft' | 'published' | 'closed';

    // Relaciones con un reclutador (Creador de la Oferta)
    // Relacion con el id de la empresa

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at?: Date;
}
