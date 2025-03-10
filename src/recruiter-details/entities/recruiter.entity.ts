import { Company } from "src/company-details/entities/company.entity";
import { User } from "../../users/entities/user.entity";
import { Column, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Offer } from "src/offers/entities/offer.entity";

@Entity('recruiter_details')
@Unique(['user_id']) // Esto asegura que user_id sea único en la tabla
export class Recruiter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  contact_email: string;

  @Column({ type: 'text', nullable: true })
  specialization: string;

  //* Definir explícitamente la columna user_id para que sea parte de la entidad
  @Column({ type: 'uuid' })
  user_id: string; // Esta es la columna que será utilizada para la restricción de unicidad

  //* Relación con User (FK user_id)
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // FK en Recruiter
  user: User;

  @ManyToMany(() => Company, (company) => company.recruiters)
  @JoinTable({
    name: 'recruiters_companies',
    joinColumn: { name: 'recruiter_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'company_id', referencedColumnName: 'id' },
  })
  companies: Company[];

  //* Relacion con El Usuario(Reclutador o empresa) creador de la oferta
  @OneToMany(() => Offer, (offer) => offer.recruiter)
  offer: Offer;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date; // Se llena cuando el registro es "eliminado"
}
