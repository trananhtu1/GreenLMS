import {
  CounterEntity,
  CounterType,
  encodePassword,
  ROLE_COUNTER_TYPE,
  RoleEntity,
  RoleName,
  UserEntity,
} from '@class-operation/libs';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CounterService } from '../counter/counter.service';
import { RoleService } from '../role/role.service';
import { UserDetailService } from '../user-detail/user-detail.service';
import { UserService } from '../user/user.service';

@Injectable()
export class DatabaseSeederService {
  constructor(
    private readonly roleService: RoleService,
    private readonly userService: UserService,
    private readonly counterService: CounterService,
    private readonly userDetailService: UserDetailService,
  ) {}

  async seed() {
    await this.seedRoles();
    await this.seedCounters();
    await this.seedUsers();
  }

  private async seedRoles() {
    const roles: RoleEntity[] = [];
    for (const roleName of Object.values(RoleName)) {
      const existingRole = await this.roleService.findByName(roleName);
      if (!existingRole) {
        const role = new RoleEntity();
        role.roleName = roleName;
        roles.push(role);
      }
    }

    await this.roleService.store(roles);
  }

  private async seedCounters() {
    const counters = Object.values(CounterType).map((type) => ({
      type,
      count: 0,
    }));

    for (const counterData of counters) {
      const existingCounter = await this.counterService.findOne({
        where: { type: counterData.type },
      });

      if (!existingCounter) {
        const counter = new CounterEntity();
        counter.type = counterData.type;
        counter.count = counterData.count;
        await this.counterService.store(counter);
      }
    }
  }

  private async seedUsers() {
    const existingAdmin = await this.userService.findOne({
      where: { email: process.env.ADMIN_EMAIL },
    });

    if (!existingAdmin) {
      const user = new UserEntity();
      user.email = (process.env.ADMIN_EMAIL || '').toLowerCase();
      user.password = encodePassword(process.env.ADMIN_PASSWORD || '');
      user.firstName = process.env.ADMIN_FIRST_NAME || '';
      user.lastName = process.env.ADMIN_LAST_NAME || '';
      const role = await this.roleService.findByName(RoleName.ADMIN);
      if (!role) {
        throw new InternalServerErrorException('Admin role not found');
      }

      const code = await this.counterService.getNextCode(
        ROLE_COUNTER_TYPE[role.roleName],
      );
      const userDetail = await this.userDetailService.createUserDetail({
        code,
      });

      user.role = role;
      user.detail = userDetail;

      await this.userService.store(user);
    }
  }
}
