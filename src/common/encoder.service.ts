import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import {v4} from "uuid";

@Injectable()
export class EncoderService {

    async encodePassword(password:string): Promise<string>{
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(password, salt)
    }

    async checkPassword(password: string, userPassword: string): Promise<boolean>{
        return await bcrypt.compare(password, userPassword);
    }

    async generateToken(): Promise <string> {
        return v4(); // Generará un token uuid
    }
}