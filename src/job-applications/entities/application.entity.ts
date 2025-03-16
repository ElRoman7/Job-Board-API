import { Candidate } from "src/candidate-details/entities/candidate.entity";
import { Offer } from "src/offers/entities/offer.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { ValidJobApplicationStatus } from "../interfaces/ValidStatus";

@Entity('job_applications')
@Unique(['candidate', 'offer'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Offer, (offer) => offer.applications)
  @JoinColumn({ name: 'offerId' })
  offer: Offer;

  @ManyToOne(() => Candidate, (candidate) => candidate.applications)
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column('text', { nullable: true })
  coverLetter?: string;

  @Column({
    type: 'enum',
    enum: ValidJobApplicationStatus, // Usamos el enum directamente
    default: ValidJobApplicationStatus.pending,
  })
  status: ValidJobApplicationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
