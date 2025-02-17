import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { TitleCasePipe } from '../common/pipes/title-case.pipe';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  
  private baseUrl : string;
  private frontUrl : string;
  private titleCasePipe = new TitleCasePipe(); // Crea una instancia del pipe
  
  constructor(private mailerService: MailerService, private readonly configService: ConfigService,) {
    this.baseUrl = this.configService.get<string>('BASE_URL');
    this.frontUrl = this.configService.get<string>('FRONTEND_URL');
  }

  async sendUserConfirmation(user: User): Promise<void> {
    const { name, activationToken, email } = user;
    const url = `${this.frontUrl}/auth/activate-account?activationToken=${activationToken}`;
    const formattedName = this.titleCasePipe.transform(name);

    try {
      await this.mailerService.sendMail({
        to: email,
        template: './confirmation',
        context: {
          url: url,
          name: formattedName,
        },
      });
    } catch (error) {
      throw new Error(`Failed to send confirmation email to ${email}: ${error.message}`);
    }
  }
  

  async sendUserResetPassword(user:User): Promise<void> {
    const { name, email, resetPasswordToken } = user;
    const url =`${this.frontUrl}/auth/reset-password?token=${resetPasswordToken}`;
    const formattedName = this.titleCasePipe.transform(name)
    return await this.mailerService.sendMail({
      to: email,
      template: './reset-password',
      context:{
        url: url,
        name: formattedName
      }

    })
  }
}
