// import { JobOffer } from "src/job-offers/entities/job-offer.entity";
import { Candidate } from "src/candidate-details/entities/candidate.entity";
import { Offer } from "src/offers/entities/offer.entity";
// import { Offer } from "src/offers/entities/offer.entity";
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from "typeorm";

@Entity('skills')
export class Skill {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', unique: true })
    name: string;

    @ManyToMany(() => Candidate, candidate => candidate.skills)
    candidates: Candidate[];

    @ManyToMany(() => Offer, offer => offer.requiredSkills)
    offers: Offer[];
}
