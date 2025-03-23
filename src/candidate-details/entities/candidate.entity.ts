import { Application } from "src/job-applications/entities/application.entity";
import { User } from "src/users/entities/user.entity";
import { Skill } from 'src/skills/entities/skill.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  JoinTable,
} from 'typeorm';
import { CvEntity } from './cv.entity';

@Entity('candidate_details')
@Unique(['user_id']) // Esto asegura que user_id sea único en la tabla
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  cvUrl: string;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column('text', { nullable: true })
  city: string; // Ciudad

  @Column('text', { nullable: true })
  state: string; // Estado

  @Column('text', { nullable: true })
  country: string; // País

  @Column('text', { nullable: true })
  website: string;

  //* Definir explícitamente la columna user_id para que sea parte de la entidad
  @Column({ type: 'uuid' })
  user_id: string;

  @OneToMany(() => Application, (application) => application.candidate)
  applications: Application[];

  //* Relación con User (FK user_id)
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // FK en Recruiter
  user: User;

  @OneToOne(() => CvEntity, (cv) => cv.candidate)
  cv: CvEntity;

  @ManyToMany(() => Skill, (skill) => skill.candidates, {
    eager: true,
  })
  @JoinTable({
    name: 'candidate_skills',
    joinColumn: { name: 'candidate_id' },
    inverseJoinColumn: { name: 'skill_id' },
  })
  skills: Skill[];
}
