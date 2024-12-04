export class LoginResponseDto {
    id: string;
    email: string;
    fullname: string;
    phoneNumber: string;
    roles: string[];
    is_active: boolean;
    token: string;
  }
  