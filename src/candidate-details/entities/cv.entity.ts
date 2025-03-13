import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from './candidate.entity';

@Entity('cv')
export class CvEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column('text')
  experiencia: string;

  @Column('text', { nullable: true })
  educacion: string;

  @Column('text', { nullable: true })
  habilidades: string;

  @OneToOne(() => Candidate, (candidate) => candidate.cv)
  @JoinColumn()
  candidate: Candidate;
}
