import { Company } from 'src/company-details/entities/company.entity';
import { Recruiter } from 'src/recruiter-details/entities/recruiter.entity';
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

    @ManyToOne(() => Company, (company) => company.offer, {eager: true})
    company: Company

    //ToDo: Categorizar
    // Relaciones con un reclutador (Creador de la Oferta)
    @ManyToOne(() => Recruiter, (recruiter) => recruiter.offer, {eager: true, nullable: true})
    recruiter: Recruiter

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at?: Date;
}
