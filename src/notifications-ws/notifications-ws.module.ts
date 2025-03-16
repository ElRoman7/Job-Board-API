import { Module } from '@nestjs/common';
import { NotificationsWsService } from './notifications-ws.service';
import { NotificationsWsGateway } from './notifications-ws.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { CommonModule } from 'src/common/common.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers:[NotificationsController],
  providers: [NotificationsWsGateway, NotificationsWsService, NotificationsService],
  imports: [TypeOrmModule.forFeature([Notification]), CommonModule, AuthModule],
  exports: [NotificationsWsService, TypeOrmModule, NotificationsService]
})
export class NotificationsWsModule {}
