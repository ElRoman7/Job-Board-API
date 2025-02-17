import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { MailService } from './mail.service';
import { UserRegisteredEvent } from 'src/auth/user-registered.event';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredListener implements IEventHandler<UserRegisteredEvent> {
    constructor(private readonly mailService: MailService) {}

    async handle(event: UserRegisteredEvent): Promise<void> {
        // Llama al servicio de correo con el objeto de usuario completo
        await this.mailService.sendUserConfirmation(event.user);
    }
}