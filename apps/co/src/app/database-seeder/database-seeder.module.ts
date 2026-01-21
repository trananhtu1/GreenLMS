import { Module } from '@nestjs/common';
import { CounterModule } from '../counter/counter.module';
import { RoleModule } from '../role/role.module';
import { UserDetailModule } from '../user-detail/user-detail.module';
import { UserModule } from '../user/user.module';
import { DatabaseSeederService } from './database-seeder.service';

@Module({
  imports: [UserModule, RoleModule, CounterModule, UserDetailModule],
  controllers: [],
  providers: [DatabaseSeederService],
})
export class DatabaseModule {}
