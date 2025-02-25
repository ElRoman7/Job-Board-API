import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {

  constructor(
    private readonly JwtService: JwtService,
    private readonly usersService : UsersService
  ) {}

  async login(loginDto: LoginDto) {
    const {email, password} = loginDto
    const user = await this.usersService.finOneByEmail(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials (email)');
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials (password)');
    }

    const userData = await this.usersService.findOneById(user.id);
    const token = this.getJwt({id: userData.id})

    return {
      user: userData,
      token
    };
  }

  getJwt(payload: JwtPayload) {
    const token = this.JwtService.sign(payload);
    return token;
  }

  async checkAuthStatus(user: User): Promise <LoginResponseDto> {
    const token = await this.getJwt({ id: user.id });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      roles: user.roles,
      is_active: user.is_active,
      token,
    };
  }




}
