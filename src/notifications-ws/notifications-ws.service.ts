import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Notification } from './entities/notification.entity';

interface ConnectedClients {
  [id: string]: Socket
}

@Injectable()
export class NotificationsWsService {
  private connectedClients: ConnectedClients = {};

  registerClient(client: Socket) {
    this.connectedClients[client.id] = client;
  }

  removeClient(clientId: string) {
    delete this.connectedClients[clientId];
  }

  getConnectedClients(): number {
    const clientsLenght = Object.keys(this.connectedClients).length;
    return clientsLenght;
  }

  emitNotification(userId: string, notification: Notification) {
    for (const clientId in this.connectedClients) {
      const client = this.connectedClients[clientId];
      if (client.handshake.query.userId === userId) {
        client.emit('notification', notification);
      }
    }
  }
}
