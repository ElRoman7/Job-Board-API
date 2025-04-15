import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Offer } from './offer.entity';

@Entity()
export class ModalityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Offer, (offer) => offer.modalityTypes, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  jobOffers: Offer[];
}

@Entity()
export class ContractType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Offer, (offer) => offer.contractTypes, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  jobOffers: Offer[];
}

@Entity()
export class ExperienceLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Offer, (offer) => offer.experienceLevels, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  jobOffers: Offer[];
}

@Entity()
export class WorkArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Offer, (offer) => offer.workAreas, { onDelete: 'CASCADE' })
  @JoinTable()
  jobOffers: Offer[];
}

@Entity()
export class AdditionalBenefit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Offer, (offer) => offer.additionalBenefits, {
    onDelete: 'CASCADE',
  })
  @JoinTable()
  jobOffers: Offer[];
}
