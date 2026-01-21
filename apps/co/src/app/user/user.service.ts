import {
  CreateUserDto,
  encodePassword,
  FindOptions,
  ROLE_COUNTER_TYPE,
  RoleName,
  UpdateUserDto,
  UserEntity,
  UserStatus,
} from '@class-operation/libs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CounterService } from '../counter/counter.service';
import { DepartmentService } from '../department/department.service';
import { FieldService } from '../field/field.service';
import { RoleService } from '../role/role.service';
import { UserDetailService } from '../user-detail/user-detail.service';

@Injectable()
export class UserService extends BaseService<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly roleService: RoleService,
    private readonly counterService: CounterService,
    private readonly userDetailService: UserDetailService,
    private readonly departmentService: DepartmentService,
    private readonly fieldService: FieldService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super(userRepository);
  }

  async findById(id: string, options?: FindOptions): Promise<UserEntity> {
    if (!id) {
      throw new BadRequestException('UserId is required');
    }

    const { relations = [] } = options || {};

    const user = await this.findOne({
      where: { id },
      relations,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'detail'],
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'phoneNumber',
        'avatar',
        'status',
        'lastLogin',
      ],
    });
  }

  async create(
    createUserDto: CreateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<UserEntity> {
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const lowerCaseEmail = createUserDto.email.toLowerCase();
    const user = await this.findOne({
      where: {
        email: lowerCaseEmail,
      },
    });
    if (user) {
      throw new BadRequestException('User already exists');
    }

    const role = await this.roleService.findByName(createUserDto.roleName);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const code = await this.counterService.getNextCode(
      ROLE_COUNTER_TYPE[role.roleName],
    );

    // Create user detail with department and field associations if provided
    const userDetailData: any = {
      code,
    };

    // Associate with department if departmentId is provided
    if (createUserDto.departmentId) {
      const department = await this.departmentService.findById(
        createUserDto.departmentId,
      );
      if (!department) {
        throw new NotFoundException('Department not found');
      }
      userDetailData.department = department;
    }

    // Associate with field if fieldId is provided and user is a teacher
    if (
      createUserDto.fieldId &&
      (role.roleName === RoleName.TEACHER_FULL_TIME ||
        role.roleName === RoleName.TEACHER_PART_TIME)
    ) {
      const field = await this.fieldService.findById(createUserDto.fieldId);
      if (!field) {
        throw new NotFoundException('Field not found');
      }
      userDetailData.field = field;
    }

    if (createUserDto.teacherLevel) {
      userDetailData.teacherLevel = createUserDto.teacherLevel;
    }

    // Upload avatar if provided
    let avatarUrl = '';
    if (avatar) {
      const uploadOptions = {
        folder: 'user-avatars',
        allowed_formats: ['jpg', 'png'],
      };
      const uploadResult = await this.cloudinaryService.uploadFile(
        avatar,
        uploadOptions,
      );
      avatarUrl = uploadResult.secure_url;
    }

    const userDetail =
      await this.userDetailService.createUserDetail(userDetailData);

    const encodedPassword = encodePassword(createUserDto.password);

    return this.store({
      ...createUserDto,
      password: encodedPassword,
      role,
      detail: userDetail,
      avatar: avatarUrl,
    });
  }

  async findUsersByRoleName(roleNames: RoleName[], query: Record<string, any>) {
    const {
      page = 1,
      limit = 10,
      sort = 'id:desc',
      search,
      status,
      roleName,
    } = query;

    const queryBuilder = this.repository
      .createQueryBuilder('entity')
      .innerJoinAndSelect('entity.role', 'role')
      .innerJoinAndSelect('entity.detail', 'detail')
      .leftJoinAndSelect('detail.department', 'department')
      .leftJoinAndSelect('detail.field', 'field')
      .where('role.roleName IN (:...roleNames)', { roleNames });

    if (search) {
      queryBuilder.andWhere(
        '(entity.firstName ILIKE :search OR entity.lastName ILIKE :search OR entity.email ILIKE :search OR detail.code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (roleName) {
      queryBuilder.andWhere('role.roleName = :roleName', { roleName });
    }

    if (status) {
      queryBuilder.andWhere('entity.status = :status', { status });
    }

    const metadata = this.repository.metadata;
    this.applyPagination(queryBuilder, page, limit);
    this.applySorting(queryBuilder, sort, metadata);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      page,
      limit,
      total,
      data,
    };
  }

  async updateById(
    id: string,
    updateUserDto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ): Promise<UserEntity> {
    const user = await this.findById(id, {
      relations: ['role', 'detail', 'detail.department', 'detail.field'],
    });

    // Handle role change
    if (
      updateUserDto.roleName &&
      updateUserDto.roleName !== user.role.roleName
    ) {
      const newRole = await this.roleService.findByName(updateUserDto.roleName);
      if (!newRole) {
        throw new NotFoundException('Role not found');
      }
      user.role = newRole;
    }

    // Handle department update
    if (updateUserDto.departmentId) {
      const department = await this.departmentService.findById(
        updateUserDto.departmentId,
      );
      if (!department) {
        throw new NotFoundException('Department not found');
      }

      if (!user.detail) {
        user.detail = await this.userDetailService.createUserDetail({
          code: await this.counterService.getNextCode(
            ROLE_COUNTER_TYPE[user.role.roleName],
          ),
        });
      }

      await this.userDetailService.update(user.detail.id, {
        departmentId: updateUserDto.departmentId,
      });
    }

    // Handle field update for teacher roles
    if (
      updateUserDto.fieldId &&
      (user.role.roleName === RoleName.TEACHER_FULL_TIME ||
        user.role.roleName === RoleName.TEACHER_PART_TIME)
    ) {
      const field = await this.fieldService.findById(updateUserDto.fieldId);
      if (!field) {
        throw new NotFoundException('Field not found');
      }

      if (!user.detail) {
        user.detail = await this.userDetailService.createUserDetail({
          code: await this.counterService.getNextCode(
            ROLE_COUNTER_TYPE[user.role.roleName],
          ),
        });
      }

      await this.userDetailService.update(user.detail.id, {
        fieldId: updateUserDto.fieldId,
      });
    }

    if (updateUserDto.teacherLevel) {
      await this.userDetailService.update(user.detail.id, {
        teacherLevel: updateUserDto.teacherLevel,
      });
    }

    // Upload avatar if provided
    let avatarUrl = user.avatar;
    if (avatar) {
      const uploadOptions = {
        folder: 'user-avatars',
        allowed_formats: ['jpg', 'png'],
      };
      const uploadResult = await this.cloudinaryService.uploadFile(
        avatar,
        uploadOptions,
      );
      avatarUrl = uploadResult.secure_url;
    }

    // Update basic user information
    const dataToUpdate: any = {
      ...(updateUserDto.firstName && { firstName: updateUserDto.firstName }),
      ...(updateUserDto.lastName && { lastName: updateUserDto.lastName }),
      ...(updateUserDto.phoneNumber && {
        phoneNumber: updateUserDto.phoneNumber,
      }),
      ...(updateUserDto.status && { status: updateUserDto.status }),
      avatar: avatarUrl,
    };

    // Update password if provided
    if (updateUserDto.password) {
      if (updateUserDto.password !== updateUserDto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }
      dataToUpdate.password = encodePassword(updateUserDto.password);
    }

    await this.userRepository.update(id, dataToUpdate);

    return user;
  }

  async updateUserStatus(id: string, status: UserStatus): Promise<UserEntity> {
    const user = await this.findById(id, {
      relations: ['role', 'detail', 'detail.department', 'detail.field'],
    });

    await this.userRepository.update(id, { status });

    return user;
  }
}
