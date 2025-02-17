import { User } from "src/users/entities/user.entity";


export class UserRegisteredEvent {
    constructor(public readonly user: User) {} // Aquí recibimos el objeto User
}
