export interface Notification {
  id: string;
  userId: string;
  title: string;
  read: boolean;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNotificationStatusDto {
  notificationIds: string[];
}
