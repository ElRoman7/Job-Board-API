import { Company } from 'src/company-details/entities/company.entity';
import { Recruiter } from 'src/recruiter-details/entities/recruiter.entity';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, DeleteDateColumn, OneToMany } from 'typeorm';
import { AdditionalBenefit, ContractType, ExperienceLevel, ModalityType, WorkArea } from './tags.entity';
import { SalaryType } from '../interfaces/valid-salary-type';
import { Application } from 'src/job-applications/entities/application.entity';

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

  @ManyToOne(() => Company, (company) => company.offer, { eager: true })
  company: Company;

  //ToDo: Categorizar    // Relaciones con un reclutador (Creador de la Oferta)
  @ManyToOne(() => Recruiter, (recruiter) => recruiter.offer, {
    eager: true,
    nullable: true,
  })
  recruiter: Recruiter;

  @ManyToMany(() => ModalityType, (modalityType) => modalityType.jobOffers)
  modalityTypes: ModalityType[];

  @ManyToMany(() => ContractType, (contractType) => contractType.jobOffers)
  contractTypes: ContractType[];

  @ManyToMany(
    () => ExperienceLevel,
    (experienceLevel) => experienceLevel.jobOffers,
  )
  experienceLevels: ExperienceLevel[];

  @ManyToMany(() => WorkArea, (workArea) => workArea.jobOffers)
  workAreas: WorkArea[];

  @ManyToMany(
    () => AdditionalBenefit,
    (additionalBenefit) => additionalBenefit.jobOffers,
  )
  additionalBenefits: AdditionalBenefit[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at?: Date;

  @Column({ type: 'decimal', nullable: true })
  salaryMin: number;

  @Column({ type: 'decimal', nullable: true })
  salaryMax: number;

  @Column({ type: 'varchar', length: 3, default: 'MXN' })
  currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  salaryType: SalaryType;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @OneToMany(() => Application, (application) => application.offer)
  applications: Application[];

  softDelete(): void {
    this.deletedAt = new Date();
  }
}
