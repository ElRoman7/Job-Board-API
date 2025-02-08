import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { ErrorHandlerService } from '../common/error-handler.service';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';
import { MailService } from 'src/mail/mail.service';
import { EncoderService } from 'src/common/encoder.service';
import { ActivateUserDto } from './dto/activate-user.dto';
import { ValidRoles } from './interfaces/valid-roles';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(
    private readonly errorHandlerService : ErrorHandlerService,
    @InjectRepository(User) private readonly usersRepository : Repository<User>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private encoderService: EncoderService,
  ) {}
  
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      return await executeWithTransaction(this.dataSource, async (queryRunner) => {
        const user = await this.prepareUserForTransaction(createUserDto);
        user.roles = [ValidRoles.candidate]
        await queryRunner.manager.save(user);
        // Maneja el envío del correo de confirmación
        try {
          await this.mailService.sendUserConfirmation(user);  // Usa await para esperar a que el correo se envíe
        } catch (e) {
          throw new Error(`User creation failed: Unable to send confirmation email ${e}`);
        }
        return user;
      });
    } catch (error) {
      this.errorHandlerService.handleDBException(error);
    }
  }
  
  async prepareUserForTransaction(createUserDto: CreateUserDto): Promise<User> {
    const findUser = await this.finOneByEmail(createUserDto.email);
    if(findUser){
      throw new ConflictException('Email already in use')
    }
    const { password, ...rest } = createUserDto;
    const user = this.usersRepository.create({
      ...rest,
      password: bcrypt.hashSync(password, 10),
    });
    user.activationToken = await this.encoderService.generateToken();
    
    return user;
  }

  async finOneByEmail(email: string): Promise<User> {
    const user: User = await this.usersRepository.findOne({
      where: { email },
      select: ['id','email','name','password', 'roles', 'phoneNumber' ,'is_active']
    })
    return user;
  }

  async findOneById(id: string): Promise<User> {
    const user: User = await this.usersRepository.findOneBy({id})
    return user;
  }

  async activateUser(activateUserDto: ActivateUserDto){
    const { activationToken } = activateUserDto;
    const user = await this.usersRepository.findOneBy({activationToken})

    if(!user){
      throw new BadRequestException('Invalid or expired token')
    }

    user.is_active = true;
    user.activationToken = null;
    await this.usersRepository.save(user);

    return {
      message: 'Account actived successfully'
    }
  }

  async getUserDetails(user : User){
    if(user.roles.includes(ValidRoles.company)){
      
    }

  }

  async updateUser(updateUserDto: UpdateUserDto, id: string){
    const user = await this.usersRepository.findOneBy({id});
    if(!user){
      throw new BadRequestException('User not found')
    }
    await this.usersRepository.update(id, updateUserDto);
    return {
      message: 'User updated successfully'
    }
  }

  async updateProfileImageUrl(url: string, id: string){
    await this.updateUser({profileImageUrl: url}, id);
    return {
      message: 'Profile image updated successfully'
    }
  }

  // findAll() {
  //   return `This action returns all users`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} user`;
  // }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
