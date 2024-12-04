import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { ErrorHandlerService } from 'src/common/error-handler.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly errorHandlerService : ErrorHandlerService,
    @InjectRepository(User) private readonly usersRepository : Repository<User>
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...rest } = createUserDto;
      const user = this.usersRepository.create({
        ...rest,
        password: bcrypt.hashSync(password, 10)
      });
      await this.usersRepository.save(user);
      return {
        user
      }
    } catch (error) {
      this.errorHandlerService.handleDBException(error)
    }
  }

  async finOneByEmail(email: string): Promise<User> {
    const user: User = await this.usersRepository.findOneBy({email})
    return user;
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
