import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { ErrorHandlerService } from '../common/error-handler.service';
import { executeWithTransaction } from 'src/common/utils/query-runner.util';
@Injectable()
export class UsersService {
  constructor(
    private readonly errorHandlerService : ErrorHandlerService,
    @InjectRepository(User) private readonly usersRepository : Repository<User>,
    private readonly dataSource: DataSource,
  ) {}
  
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      return await executeWithTransaction(this.dataSource, async (queryRunner) => {
        const user = await this.prepareUserForTransaction(createUserDto);
        await queryRunner.manager.save(user);
        return user;
      });
    } catch (error) {
      this.errorHandlerService.handleDBException(error);
    }
  }
  
  async prepareUserForTransaction(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const user = this.usersRepository.create({
      ...rest,
      password: bcrypt.hashSync(password, 10),
    });
    return user;
  }

  async finOneByEmail(email: string): Promise<User> {
    const user: User = await this.usersRepository.findOneBy({email})
    return user;
  }

  async findOneById(id: string): Promise<User> {
    const user: User = await this.usersRepository.findOneBy({id})
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
