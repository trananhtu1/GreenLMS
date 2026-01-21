import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Channel, connect, Connection } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: Connection;
  private channel: Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor() {}

  async onModuleInit() {
    try {
      await this.connectToRabbitMQ();
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  private async connectToRabbitMQ() {
    const defaultUrl = process.env.RABBITMQ_URL;
    const http = process.env.RABBITMQ_HTTP;
    const user = process.env.RABBITMQ_USER;
    const password = process.env.RABBITMQ_PASSWORD;
    const host = process.env.RABBITMQ_HOST;
    const port = process.env.RABBITMQ_PORT || 5672;
    const url = defaultUrl || {
      protocol: http,
      username: user,
      password,
      hostname: host,
      port: Number(port),
    };

    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();

    const queue = process.env.RABBITMQ_QUEUE || 'notifications';
    await this.channel.assertQueue(queue, { durable: true });

    this.logger.log('RabbitMQ connection established');
  }

  async sendEmailNotification(email: string, subject: string, content: string) {
    const queue = process.env.RABBITMQ_QUEUE || 'notifications';
    const message = {
      type: 'email-notification',
      data: { email, subject, content },
    };
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    this.logger.log(`Email notification sent to queue for ${email}`);
  }

  async sendWebNotification(
    userId: string,
    notification: { title: string; content: string },
  ) {
    const queue = process.env.RABBITMQ_QUEUE || 'notifications';
    const messageData = {
      type: 'web-notification',
      data: {
        userId,
        title: notification.title,
        content: notification.content,
      },
    };
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(messageData)));
    this.logger.log(`Web notification sent to queue for user ${userId}`);
  }
}
