import { Candidate } from "src/candidate-details/entities/candidate.entity";
import { Offer } from "src/offers/entities/offer.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity('job_applications')
@Unique(['candidate', 'offer'])
export class Application {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Offer, offer => offer.applications)
    @JoinColumn({ name: 'offerId' })
    offer: Offer;

    @ManyToOne(() => Candidate, candidate => candidate.applications)
    @JoinColumn({ name: 'candidateId' })
    candidate: Candidate;

    @Column('text', {nullable: true})
    coverLetter?: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    })
    status: 'pending' | 'accepted' | 'rejected';

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
