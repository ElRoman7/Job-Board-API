import { Controller, Get, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Auth, GetUser } from "src/auth/decorators";
import { ValidRoles } from "src/users/interfaces/valid-roles";
import { User } from "src/users/entities/user.entity";


@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Auth(ValidRoles.candidate, ValidRoles.company, ValidRoles.recruiter)
  @Patch('/read/:id')
  markAsARead(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.notificationsService.markNotificationAsRead(id, user.id);
  }

  /**
   * Controller for handling notification-related endpoints.
   *
   * @example
   * // Get all notifications (both active and inactive)
   * GET /notifications
   *
   * @example
   * // Get only active (unread) notifications
   * GET /notifications/active
   *
   * @example
   * // Get inactive (read) notifications by omitting 'active' parameter or using any other value
   * GET /notifications/read
   */
  @Auth(ValidRoles.candidate, ValidRoles.company, ValidRoles.recruiter)
  @Get(':status')
  getNotifications(@GetUser() user: User, @Param('status') status?: string) {
    const getActive = status === 'active';
    return this.notificationsService.getUserNotifications(user.id, getActive);
  }
}
