import { Exclude } from "class-transformer";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User{
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({length: 40})
    name: string;

    @Column({length:100, unique: true})
    email:string

    @Column({length:'100', select: false})
    @Exclude()
    password: string;
    
    @Column({type: 'varchar', length: 15, nullable: true, unique: true})
    phoneNumber: string;
  
    @Column('text', {
        array: true,
        default: ['candidate']
    }) //? Guarda los roles como un array de strings
    roles: string[];

    @Column({ nullable: true })
    profileImageUrl: string; // Nueva propiedad para almacenar la URL de la imagen de perfil
  
    @Column({ type: 'boolean',  default: true })
    is_active: boolean;

    @Column({ type:'uuid', unique: true, name: 'activation_token', nullable: true })
    activationToken: string;

    @Column({ type:'uuid', unique: true, name: 'resetPassword_token', nullable: true })
    resetPasswordToken: string;

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