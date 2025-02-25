import { Company } from "src/company-details/entities/company.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { Recruiter } from "./recruiter.entity";

@Entity()
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Recruiter, { eager: true })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: Recruiter;

  @ManyToOne(() => Company, { eager: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column()
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';

  @Column({ type: 'uuid' })
  token: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date;
}
