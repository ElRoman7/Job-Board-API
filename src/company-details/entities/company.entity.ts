import { Recruiter } from "src/recruiter-details/entities/recruiter.entity";
import { User } from "../../users/entities/user.entity";
import { ManyToOne, JoinColumn, PrimaryGeneratedColumn, Column, ManyToMany, Entity, Unique, OneToMany, JoinTable } from "typeorm";
import { Offer } from "src/offers/entities/offer.entity";
import { Industry } from "./industry.entity";

@Entity('company_details')
@Unique(['user_id']) // Esto asegura que user_id sea único en la tabla
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  address: string; // Dirección física

  @Column('text')
  city: string; // Ciudad

  @Column('text')
  state: string; // Estado

  @Column('text')
  country: string; // País

  @Column('text', { nullable: true })
  website: string; // Sitio web de la empresa

  @Column('text', { nullable: true })
  description: string; // Descripción de la empresa

  @ManyToMany(() => Industry, (industry) => industry.companies)
  @JoinTable({
    name: 'company_industries',
    joinColumn: {
      name: 'company_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'industry_id',
      referencedColumnName: 'id',
    },
  })
  industries: Industry[];

  @Column('text', { nullable: true })
  contact_email: string; // Correo electrónico de contacto

  //* Definir explícitamente la columna user_id para que sea parte de la entidad
  @Column({ type: 'uuid' })
  user_id: string; // Esta es la columna que será utilizada para la restricción de unicidad

  //* Relación con User (FK user_id)
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // FK en Company
  user: User;

  @OneToMany(() => Offer, (offer) => offer.company)
  offer: Offer;

  @ManyToMany(() => Recruiter, (recruiter) => recruiter.companies)
  @JoinTable({
    name: 'recruiters_companies',
    joinColumn: { name: 'company_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'recruiter_id', referencedColumnName: 'id' },
  })
  recruiters: Recruiter[];
}
