import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as http from 'http';
import { Server } from 'socket.io';

@Injectable()
export class SocketService implements OnModuleInit {
  private readonly logger = new Logger('SocketService');
  private server: Server;
  private httpServer: http.Server;
  private connectedClients = new Map<string, string>();

  constructor() {
    this.httpServer = http.createServer();
    this.server = new Server(this.httpServer, {
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new BadRequestException('Not allowed by CORS'));
          }
        },
        methods: ['GET', 'POST'],
      },
    });
  }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.logger.log(`Client connected: ${socket.id}`);

      socket.on('authenticate', (userId: string) => {
        this.connectedClients.set(userId, socket.id);
        this.logger.log(`User ${userId} authenticated`);
      });

      socket.on('disconnect', () => {
        this.logger.log(`Client disconnected: ${socket.id}`);

        // Remove user from connected clients
        for (const [userId, clientId] of this.connectedClients.entries()) {
          if (clientId === socket.id) {
            this.connectedClients.delete(userId);
            break;
          }
        }
      });
    });

    const port = process.env.SOCKET_PORT || 8082;
    this.httpServer.listen(port, () => {
      this.logger.log(`Socket.IO server running on port ${port}`);
    });
  }

  sendNotificationToUser(userId: string, notification: any) {
    const clientId = this.connectedClients.get(userId);
    if (clientId) {
      this.server.to(clientId).emit('notification', notification);
      this.logger.log(
        `Notification sent to user ${userId}: ${notification.title}`,
      );
    } else {
      this.logger.warn(
        `User ${userId} is not connected, notification queued for next login`,
      );
    }
  }

  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
    this.logger.log('Broadcast notification sent to all connected clients');
  }
}
