import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { NotificationsWsService } from "./notifications-ws.service";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly notificationsWsService: NotificationsWsService
  ) {}

  async createNotification(
    userId: string,
    message: string,
    link?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      message,
      link,
    });
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Emitir la notificación al cliente conectado
    this.notificationsWsService.emitNotification(userId, savedNotification);

    return savedNotification;
  }

  async getUserNotifications(userId: string, activeOnly?: boolean): Promise<Notification[]> {
    const whereCondition: any = { userId };
    
    if (activeOnly !== undefined) {
      whereCondition.isRead = !activeOnly; // If activeOnly is true, get unread notifications
    }
    
    return await this.notificationRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  async markNotificationAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }
}
