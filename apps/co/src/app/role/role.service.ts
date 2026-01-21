import { RoleEntity, RoleName } from '@class-operation/libs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';

@Injectable()
export class RoleService extends BaseService<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {
    super(roleRepository);
  }

  async findByName(roleName: RoleName): Promise<RoleEntity | null> {
    const role = await this.roleRepository.findOne({ where: { roleName } });

    return role;
  }
}
