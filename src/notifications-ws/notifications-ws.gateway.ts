import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { NotificationsWsService } from './notifications-ws.service';
import { Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly notificationsWsService: NotificationsWsService,
  ) {}

  handleConnection(client: Socket) {
    // console.log('Cliente Conectado:', client.id);
    this.notificationsWsService.registerClient(client);

    console.log({
      conectados: this.notificationsWsService.getConnectedClients(),
    });
  }

  handleDisconnect(client: Socket) {
    // console.log('Cliente desconectado:' , client.id);
    this.notificationsWsService.removeClient(client.id);
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(@MessageBody() notificationId: string) {
    // Aquí puedes manejar la lógica para marcar una notificación como leída
    console.log(`Notificación ${notificationId} marcada como leída`);
  }
}
