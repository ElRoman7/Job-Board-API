import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {unique: true})
    email:string

    @Column('text')
    password: string;
  
    @Column('text')
    fullname: string;
    
    @Column({type: 'varchar', length: 15, nullable: true, unique: true})
    phoneNumber: string;
  
    @Column('text', {
        array: true,
        default: ['candidate']
    }) //? Guarda los roles como un array de strings
    roles: string[];
  
    @Column({ default: true })
    is_active: boolean;


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;
  
    @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
    


    // ToDo: RFC
    

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();
    }
}