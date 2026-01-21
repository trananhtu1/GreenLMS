import { CustomExceptionsFilter, ListEntity } from '@class-operation/libs';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { ClassModule } from './class/class.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CounterModule } from './counter/counter.module';
import { CourseModule } from './course/course.module';
import { DatabaseSeederService } from './database-seeder/database-seeder.service';
import { DepartmentModule } from './department/department.module';
import { FieldModule } from './field/field.module';
import { NotificationModule } from './notification/notification.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RequestModule } from './request/request.module';
import { RoleModule } from './role/role.module';
import { RoomModule } from './room/room.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';
import { UserDetailModule } from './user-detail/user-detail.module';
import { UserModule } from './user/user.module';
import { WeeklyNormModule } from './weekly-norm/weekly-norm.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [...ListEntity],
      synchronize: true, // Don't use this in production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    }),
    CloudinaryModule,
    AuthModule,
    UserModule,
    RoleModule,
    CounterModule,
    UserDetailModule,
    RequestModule,
    WeeklyNormModule,
    ScheduleModule,
    RoomModule,
    CourseModule,
    ClassModule,
    RabbitMQModule,
    NotificationModule,
    FieldModule,
    DepartmentModule,
    SupportTicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseSeederService,
    {
      provide: APP_FILTER,
      useClass: CustomExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly databaseSeederService: DatabaseSeederService) {}

  async onModuleInit() {
    await this.databaseSeederService.seed();
  }
}
