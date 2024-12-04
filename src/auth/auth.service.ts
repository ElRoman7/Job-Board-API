import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'

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

    return {
      ...user,
      token: this.getJwt({id: user.id})
    };
  }

  private getJwt(payload: JwtPayload) {
    const token = this.JwtService.sign(payload);
    return token;
  }



}
