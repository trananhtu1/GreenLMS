import {
  CreateBusySchedulesRequestDto,
  CreateSupportTicketRequestDto,
  CreateTimeOffRequestDto,
  CreateWeeklyNormRequestDto,
  GetRequestDto,
  RequestAction,
  RequestEntity,
  RequestStatus,
  RequestType,
  RoleName,
  ScheduleType,
  SupportTicketEntity,
  UpdateBusySchedulesRequestDto,
  UpdateTimeOffRequestDto,
  UpdateWeeklyNormRequestDto,
  UserStatus,
} from '@class-operation/libs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { pick } from 'lodash';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { ScheduleService } from '../schedule/schedule.service';
import { SupportTicketService } from '../support-ticket/support-ticket.service';
import { WeeklyNormService } from '../weekly-norm/weekly-norm.service';
import { FieldService } from './../field/field.service';
import { UserDetailService } from './../user-detail/user-detail.service';

@Injectable()
export class RequestService extends BaseService<RequestEntity> {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
    private readonly scheduleService: ScheduleService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly weeklyNormService: WeeklyNormService,
    private readonly fieldService: FieldService,
    private readonly userDetailService: UserDetailService,
    private readonly supportTicketService: SupportTicketService,
  ) {
    super(requestRepository);
  }

  private async getFieldTeacherIds(managerId: string): Promise<string[]> {
    // Find the field where this manager is leader
    const field = await this.fieldService.findOne({
      where: { leaderId: managerId },
    });

    if (!field) {
      return [];
    }

    // Get all user detail records that belong to this field
    const userDetails = await this.userDetailService.findAll({
      where: { fieldId: field.id },
      relations: ['user'],
    });

    // Extract the teacher IDs
    return userDetails.map((detail) => detail.user.id);
  }

  async queryWeeklyNorms(
    getRequestDto: GetRequestDto,
    userId: string,
    role: RoleName,
  ) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt:desc',
      ...filter
    } = getRequestDto;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.weeklyNorms', 'weeklyNorm')
      .leftJoinAndSelect('entity.creator', 'creator')
      .leftJoinAndSelect('entity.requester', 'requester')
      .leftJoinAndSelect('entity.approver', 'approver')
      .where('entity.type = :type', { type: RequestType.WEEKLY_NORM });

    switch (role) {
      case RoleName.ADMIN:
        break;
      case RoleName.MANAGE:
        const teacherIds = await this.getFieldTeacherIds(userId);
        if (teacherIds.length > 0) {
          queryBuilder.andWhere(
            '(entity.creatorId IN (:...teacherIds) OR entity.requesterId = :userId)',
            {
              teacherIds,
              userId,
            },
          );
        } else {
          queryBuilder.andWhere('entity.requesterId = :userId', { userId });
        }
        break;
      case RoleName.TEACHER_FULL_TIME:
      case RoleName.TEACHER_PART_TIME:
        queryBuilder.andWhere('entity.creatorId = :userId', { userId });
        break;
    }

    const metadata = this.repository.metadata;
    this.applyFiltering(queryBuilder, filter, metadata);
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

  async createWeeklyNorms(
    createRequestDto: CreateWeeklyNormRequestDto,
    userId: string,
    role: RoleName,
  ) {
    let statusWeeklyNorm = UserStatus.BLOCKED;
    switch (role) {
      case RoleName.ADMIN:
        createRequestDto.status = RequestStatus.APPROVED;
        statusWeeklyNorm = UserStatus.ACTIVE;
        break;
      case RoleName.TEACHER_FULL_TIME:
      case RoleName.TEACHER_PART_TIME:
        createRequestDto.teacherId = userId;
        createRequestDto.status = RequestStatus.PENDING;
        break;
    }

    const request = await this.store({
      ...pick(createRequestDto, ['name', 'description', 'status']),
      type: RequestType.WEEKLY_NORM,
      requesterId: createRequestDto.teacherId,
      creatorId: userId,
    });

    const weeklyNorms = createRequestDto.weeklyNorms.map((norm) => {
      return {
        ...pick(norm, ['startDate', 'endDate', 'quantity']),
        teacherId: createRequestDto.teacherId,
        requestId: request.id,
        status: statusWeeklyNorm,
      };
    });

    await this.weeklyNormService.store(weeklyNorms);

    return request;
  }

  async updateWeeklyNorm(
    id: string,
    updateData: UpdateWeeklyNormRequestDto,
    role: RoleName,
  ) {
    // Find the request to update
    const request = await this.findOne({
      where: { id, type: RequestType.WEEKLY_NORM },
      relations: ['weeklyNorms'],
    });

    if (!request) {
      throw new NotFoundException('Weekly norm request not found');
    }

    // Only allow updates for PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new Error('Only pending requests can be updated');
    }

    // Update request basic info
    const updatedRequest = await this.store({
      ...request,
      name: updateData.name,
      description: updateData.description,
    });

    // Delete existing weekly norms using the repository directly
    if (request.weeklyNorms.length > 0) {
      await this.weeklyNormService.deleteByRequestId(request.id);
    }

    // Create new weekly norms
    const weeklyNorms = updateData?.weeklyNorms?.map((norm) => {
      return {
        ...pick(norm, ['startDate', 'endDate', 'quantity']),
        teacherId: updateData.teacherId,
        requestId: request.id,
        status:
          role === RoleName.ADMIN ? UserStatus.ACTIVE : UserStatus.BLOCKED,
      };
    });

    // Store new weekly norms
    await this.weeklyNormService.store(weeklyNorms);

    return updatedRequest;
  }

  async updateWeeklyNormStatus(
    id: string,
    action: RequestAction,
    userId?: string,
  ) {
    const request = await this.findOne({
      where: { id, type: RequestType.WEEKLY_NORM },
      relations: ['weeklyNorms', 'requester', 'creator'],
    });

    if (!request) {
      throw new NotFoundException('Weekly norm request not found');
    }

    // Handle based on action
    if (action === RequestAction.APPROVE) {
      // Check if request can be approved
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for approval');
      }

      // Check for overlapping active weekly norms
      if (request.weeklyNorms?.length > 0) {
        for (const norm of request.weeklyNorms) {
          const hasOverlap = await this.weeklyNormService.checkOverlappingNorms(
            norm.teacherId,
            norm.startDate,
            norm.endDate,
            request.id, // exclude current request's norms
          );

          if (hasOverlap) {
            throw new BadRequestException(
              `Cannot approve request. There is already an active weekly norm for teacher ID ${norm.teacherId} in the period from ${norm.startDate.toISOString().split('T')[0]} to ${norm.endDate.toISOString().split('T')[0]}.`,
            );
          }
        }
      }

      // Update request status and approverId
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.APPROVED,
        approverId: userId,
      });

      // Update all weekly norms to active
      if (request.weeklyNorms?.length > 0) {
        await Promise.all(
          request.weeklyNorms.map((norm) =>
            this.weeklyNormService.update(norm.id, {
              status: UserStatus.ACTIVE,
            }),
          ),
        );
      }

      // Send notification via RabbitMQ
      if (request.requester) {
        const notificationTitle = 'Weekly Norm Request Approved';
        const notificationContent = `Your request "${request.name}" has been approved.`;

        // Send email notification
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );

        // Send web notification
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.REJECT) {
      // Check if request can be rejected
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for rejection');
      }

      // Update request status and approverId
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.REJECTED,
        approverId: userId,
      });

      // Keep weekly norms as BLOCKED
      if (request.weeklyNorms?.length > 0) {
        await Promise.all(
          request.weeklyNorms.map((norm) =>
            this.weeklyNormService.update(norm.id, {
              status: UserStatus.BLOCKED,
            }),
          ),
        );
      }

      // Send notification via RabbitMQ
      if (request.requester) {
        const notificationTitle = 'Weekly Norm Request Rejected';
        const notificationContent = `Your request "${request.name}" has been rejected.`;

        // Send email notification
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );

        // Send web notification
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.CANCEL) {
      // Check if request can be canceled
      if (request.status !== RequestStatus.APPROVED) {
        throw new BadRequestException('Only approved requests can be canceled');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.CANCELED,
      });

      // Update all weekly norms to inactive
      if (request.weeklyNorms?.length > 0) {
        await Promise.all(
          request.weeklyNorms.map((norm) =>
            this.weeklyNormService.update(norm.id, {
              status: UserStatus.BLOCKED,
            }),
          ),
        );
      }

      // Send notification via RabbitMQ
      if (request.requester) {
        const notificationTitle = 'Weekly Norm Request Canceled';
        const notificationContent = `Your request "${request.name}" has been canceled.`;

        // Send email notification
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );

        // Send web notification
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    }

    throw new BadRequestException(
      `Invalid action: ${action}. Must be one of: ${Object.values(
        RequestAction,
      ).join(', ')}`,
    );
  }

  async queryTimeOffRequests(
    getRequestDto: GetRequestDto,
    userId: string,
    role: RoleName,
  ) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt:desc',
      ...filter
    } = getRequestDto;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.schedules', 'schedules')
      .leftJoinAndSelect('entity.creator', 'creator')
      .leftJoinAndSelect('entity.requester', 'requester')
      .leftJoinAndSelect('entity.approver', 'approver')
      .where('entity.type = :type', { type: RequestType.TIME_OFF });

    switch (role) {
      case RoleName.ADMIN:
        break;
      case RoleName.MANAGE:
        const teacherIds = await this.getFieldTeacherIds(userId);
        if (teacherIds.length > 0) {
          queryBuilder.andWhere(
            '(entity.creatorId IN (:...teacherIds) OR entity.requesterId = :userId)',
            {
              teacherIds,
              userId,
            },
          );
        } else {
          queryBuilder.andWhere('entity.requesterId = :userId', { userId });
        }
        break;
      case RoleName.TEACHER_PART_TIME:
        queryBuilder.andWhere('entity.creatorId = :userId', { userId });
        break;
    }

    const metadata = this.repository.metadata;
    this.applyFiltering(queryBuilder, filter, metadata);
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

  async createTimeOffSchedule(
    createScheduleDto: CreateTimeOffRequestDto,
    userId: string,
    role: RoleName,
  ) {
    // Determine initial status based on role
    const isAdmin = role === RoleName.ADMIN;
    const status = isAdmin ? RequestStatus.APPROVED : RequestStatus.PENDING;
    const scheduleStatus = isAdmin ? UserStatus.ACTIVE : UserStatus.BLOCKED;

    // Create request first
    const request = await this.store({
      name: createScheduleDto.name,
      description: createScheduleDto.description,
      creatorId: userId,
      requesterId: isAdmin ? null : userId,
      type: RequestType.TIME_OFF,
      status: status,
    });

    const schedules = await Promise.all(
      createScheduleDto.schedules.map((schedule) =>
        this.scheduleService.store({
          name: createScheduleDto.name,
          description: createScheduleDto.description,
          type: ScheduleType.BUSY,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          teacherId: isAdmin ? null : userId,
          requestId: request.id,
          status: scheduleStatus,
        }),
      ),
    );

    return { request, schedules };
  }

  async getTimeOffScheduleById(id: string) {
    const request = await this.findOne({
      where: { id, type: RequestType.TIME_OFF },
      relations: ['schedules', 'creator', 'requester', 'approver'],
    });

    if (!request) {
      throw new NotFoundException('Time off schedule request not found');
    }

    // Fetch all schedules associated with this time off request
    if (!request.schedules) {
      request.schedules = await this.scheduleService.findAll({
        where: { requestId: id },
      });
    }

    return request;
  }

  async updateTimeOffSchedule(id: string, updateData: UpdateTimeOffRequestDto) {
    const request = await this.findOne({
      where: { id, type: RequestType.TIME_OFF },
      relations: ['schedules'],
    });

    if (!request) {
      throw new NotFoundException('Time off schedule request not found');
    }

    // Only allow updates for PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated');
    }

    // Update request
    const updatedRequest = await this.store({
      ...request,
      name: updateData.name,
      description: updateData.description,
    });

    // Update or create schedules
    if (updateData.schedules && updateData.schedules.length > 0) {
      // Delete existing schedules
      if (request.schedules && request.schedules.length > 0) {
        for (const schedule of request.schedules) {
          await this.scheduleService.delete(schedule.id);
        }
      }

      // Create new schedules
      for (const scheduleData of updateData.schedules) {
        await this.scheduleService.store({
          name: updateData.name,
          description: updateData.description,
          type: ScheduleType.BUSY,
          startDate: scheduleData.startDate,
          endDate: scheduleData.endDate,
          requestId: request.id,
          teacherId: request.requesterId,
          status: UserStatus.BLOCKED,
        });
      }
    }

    return updatedRequest;
  }

  async updateTimeOffStatus(
    id: string,
    action: RequestAction,
    userId?: string,
  ) {
    // Modified to include 'schedules' relation
    const request = await this.findOne({
      where: { id, type: RequestType.TIME_OFF },
      relations: ['schedules', 'requester'],
    });

    if (!request) {
      throw new NotFoundException('Time off schedule request not found');
    }

    if (action === RequestAction.APPROVE) {
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for approval');
      }

      // Check for overlapping schedules if needed
      if (request.schedules && request.schedules.length > 0) {
        for (const schedule of request.schedules) {
          const hasOverlap =
            await this.scheduleService.checkOverlappingSchedules(
              schedule.teacherId,
              schedule.startDate,
              schedule.endDate,
              request.id, // exclude current request's schedule
            );

          if (hasOverlap) {
            throw new BadRequestException(
              `Cannot approve request. There is already an active schedule for teacher ID ${schedule.teacherId} in the requested period.`,
            );
          }
        }
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.APPROVED,
        approverId: userId,
      });

      // Update all schedules status to ACTIVE
      if (request.schedules && request.schedules.length > 0) {
        for (const schedule of request.schedules) {
          await this.scheduleService.updateById(schedule.id, {
            status: UserStatus.ACTIVE,
          });
        }
      }

      // Added notification for Time Off approval
      if (request.requester) {
        const notificationTitle = 'Time Off Request Approved';
        const notificationContent = `Your request "${request.name}" has been approved.`;
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.REJECT) {
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for rejection');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.REJECTED,
        approverId: userId,
      });

      // Keep all schedules as BLOCKED
      if (request.schedules && request.schedules.length > 0) {
        for (const schedule of request.schedules) {
          await this.scheduleService.updateById(schedule.id, {
            status: UserStatus.BLOCKED,
          });
        }
      }

      // Send notification for Time Off rejection
      if (request.requester) {
        const notificationTitle = 'Time Off Request Rejected';
        const notificationContent = `Your request "${request.name}" has been rejected.`;
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.CANCEL) {
      if (request.status !== RequestStatus.APPROVED) {
        throw new BadRequestException('Only approved requests can be canceled');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.CANCELED,
      });

      // Update all schedules to BLOCKED
      if (request.schedules && request.schedules.length > 0) {
        for (const schedule of request.schedules) {
          await this.scheduleService.updateById(schedule.id, {
            status: UserStatus.BLOCKED,
          });
        }
      }

      // Added notification for Time Off cancellation
      if (request.requester) {
        const notificationTitle = 'Time Off Request Canceled';
        const notificationContent = `Your request "${request.name}" has been canceled.`;
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    }

    throw new BadRequestException(
      `Invalid action: ${action}. Must be one of: ${Object.values(RequestAction).join(', ')}`,
    );
  }

  async queryBusyScheduleRequests(
    getRequestDto: GetRequestDto,
    userId: string,
    role: RoleName,
  ) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt:desc',
      ...filter
    } = getRequestDto;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.schedules', 'schedules')
      .leftJoinAndSelect('entity.creator', 'creator')
      .leftJoinAndSelect('entity.requester', 'requester')
      .leftJoinAndSelect('entity.approver', 'approver')
      .where('entity.type = :type', { type: RequestType.BUSY_SCHEDULE });

    switch (role) {
      case RoleName.ADMIN:
        break;
      case RoleName.MANAGE:
        const teacherIds = await this.getFieldTeacherIds(userId);
        if (teacherIds.length > 0) {
          queryBuilder.andWhere(
            '(entity.creatorId IN (:...teacherIds) OR entity.requesterId = :userId)',
            {
              teacherIds,
              userId,
            },
          );
        } else {
          queryBuilder.andWhere('entity.requesterId = :userId', { userId });
        }
        break;
      case RoleName.TEACHER_PART_TIME:
        queryBuilder.andWhere('entity.creatorId = :userId', { userId });
        break;
    }

    const metadata = this.repository.metadata;
    this.applyFiltering(queryBuilder, filter, metadata);
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

  async createBusySchedule(
    createScheduleDto: CreateBusySchedulesRequestDto,
    userId: string,
    role: RoleName,
  ) {
    // Determine initial status based on role
    const isAdmin = role === RoleName.ADMIN;
    const status = isAdmin ? RequestStatus.APPROVED : RequestStatus.PENDING;
    const scheduleStatus = isAdmin ? UserStatus.ACTIVE : UserStatus.BLOCKED;

    // Create request first
    const request = await this.store({
      name: createScheduleDto.name,
      description: createScheduleDto.description,
      creatorId: userId,
      requesterId: isAdmin ? null : userId,
      type: RequestType.BUSY_SCHEDULE,
      status: status,
    });

    // Create schedule using the service
    const schedule = await this.scheduleService.store({
      name: createScheduleDto.name,
      description: createScheduleDto.description,
      type: ScheduleType.BUSY,
      startDate: createScheduleDto.startDate,
      endDate: createScheduleDto.endDate,
      teacherId: isAdmin ? null : userId,
      requestId: request.id,
      status: scheduleStatus,
    });

    return { request, schedule };
  }

  async getBusyScheduleById(id: string) {
    const request = await this.findOne({
      where: { id, type: RequestType.BUSY_SCHEDULE },
      relations: ['schedules', 'creator', 'requester', 'approver'],
    });

    if (!request) {
      throw new NotFoundException('Busy schedule request not found');
    }

    return request;
  }

  async updateBusySchedule(
    id: string,
    updateData: UpdateBusySchedulesRequestDto,
  ) {
    const request = await this.findOne({
      where: { id, type: RequestType.BUSY_SCHEDULE },
      relations: ['schedules'],
    });

    if (!request) {
      throw new NotFoundException('Busy schedule request not found');
    }

    // Only allow updates for PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be updated');
    }

    // Update request
    const updatedRequest = await this.store({
      ...request,
      name: updateData.name,
      description: updateData.description,
    });

    // Update schedule using the service
    if (request.schedules && request.schedules.length > 0) {
      await this.scheduleService.updateById(request.schedules[0].id, {
        name: updateData.name,
        description: updateData.description,
        startDate: updateData.startDate,
        endDate: updateData.endDate,
      });
    }

    return updatedRequest;
  }

  async updateBusyScheduleStatus(
    id: string,
    action: RequestAction,
    userId?: string,
  ) {
    const request = await this.findOne({
      where: { id, type: RequestType.BUSY_SCHEDULE },
      relations: ['schedules', 'requester'],
    });

    if (!request) {
      throw new NotFoundException('Busy schedule request not found');
    }

    if (action === RequestAction.APPROVE) {
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for approval');
      }

      // Check for overlapping schedules if needed
      if (request.schedules && request.schedules.length > 0) {
        const schedule = request.schedules[0];
        if (schedule && schedule.teacherId) {
          const hasOverlap =
            await this.scheduleService.checkOverlappingSchedules(
              schedule.teacherId,
              schedule.startDate,
              schedule.endDate,
              request.id, // exclude current request's schedule
            );

          if (hasOverlap) {
            throw new BadRequestException(
              `Cannot approve request. There is already an active schedule for teacher ID ${schedule.teacherId} in the requested period.`,
            );
          }
        }
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.APPROVED,
        approverId: userId,
      });

      // Update schedule status using the service
      if (request.schedules && request.schedules.length > 0) {
        await this.scheduleService.updateById(request.schedules[0].id, {
          status: UserStatus.ACTIVE,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.REJECT) {
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be rejected');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for rejection');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.REJECTED,
        approverId: userId,
      });

      // Keep schedule as BLOCKED
      if (request.schedules && request.schedules.length > 0) {
        await this.scheduleService.updateById(request.schedules[0].id, {
          status: UserStatus.BLOCKED,
        });
      }

      // Send notification for Busy Schedule rejection
      if (request.requester) {
        const notificationTitle = 'Busy Schedule Request Rejected';
        const notificationContent = `Your request "${request.name}" has been rejected.`;
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.CANCEL) {
      if (request.status !== RequestStatus.APPROVED) {
        throw new BadRequestException('Only approved requests can be canceled');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.CANCELED,
      });

      // Update schedule status using the service
      if (request.schedules && request.schedules.length > 0) {
        await this.scheduleService.updateById(request.schedules[0].id, {
          status: UserStatus.BLOCKED,
        });
      }

      return updatedRequest;
    }

    throw new BadRequestException(
      `Invalid action: ${action}. Must be one of: ${Object.values(
        RequestAction,
      ).join(', ')}`,
    );
  }

  // Delete Weekly Norm request
  async deleteWeeklyNorm(id: string, userId: string) {
    const request = await this.findOne({
      where: { id, type: RequestType.WEEKLY_NORM },
      relations: ['weeklyNorms', 'creator'],
    });

    if (!request) {
      throw new NotFoundException('Weekly norm request not found');
    }

    // Only allow deleting PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be deleted');
    }

    // Ensure only the creator can delete their own request
    if (request.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    // Delete associated weekly norms first
    if (request.weeklyNorms && request.weeklyNorms.length > 0) {
      await this.weeklyNormService.deleteByRequestId(request.id);
    }

    // Delete the request
    await this.requestRepository.remove(request);
  }

  // Delete Time Off request
  async deleteTimeOff(id: string, userId: string) {
    const request = await this.findOne({
      where: { id, type: RequestType.TIME_OFF },
      relations: ['schedules', 'creator'],
    });

    if (!request) {
      throw new NotFoundException('Time off request not found');
    }

    // Only allow deleting PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be deleted');
    }

    // Ensure only the creator can delete their own request
    if (request.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    // Delete associated schedules first
    if (request.schedules && request.schedules.length > 0) {
      for (const schedule of request.schedules) {
        await this.scheduleService.delete(schedule.id);
      }
    }

    // Delete the request
    await this.requestRepository.remove(request);
  }

  // Delete Busy Schedule request
  async deleteBusySchedule(id: string, userId: string) {
    const request = await this.findOne({
      where: { id, type: RequestType.BUSY_SCHEDULE },
      relations: ['schedules', 'creator'],
    });

    if (!request) {
      throw new NotFoundException('Busy schedule request not found');
    }

    // Only allow deleting PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be deleted');
    }

    // Ensure only the creator can delete their own request
    if (request.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    // Delete associated schedule first
    if (request.schedules && request.schedules.length > 0) {
      for (const schedule of request.schedules) {
        await this.scheduleService.delete(schedule.id);
      }
    }

    // Delete the request
    await this.requestRepository.remove(request);
  }

  async createSupportTicket(
    createSupportTicketDto: CreateSupportTicketRequestDto,
    userId: string,
    role: RoleName,
  ): Promise<SupportTicketEntity> {
    switch (role) {
      case RoleName.ADMIN:
      case RoleName.RECEPTIONIST:
        createSupportTicketDto.status = RequestStatus.APPROVED;
        break;
      case RoleName.TEACHER_PART_TIME:
      case RoleName.TEACHER_FULL_TIME:
        createSupportTicketDto.status = RequestStatus.PENDING;
        createSupportTicketDto.requesterId = userId;
        break;
    }

    const request = await this.store({
      name: createSupportTicketDto.name,
      description: createSupportTicketDto.description,
      type: RequestType.SUPPORT_TICKET,
      status: RequestStatus.PENDING,
      creatorId: userId,
      requesterId: createSupportTicketDto.requesterId,
    });

    return this.supportTicketService.store({
      requestId: request.id,
      classId: createSupportTicketDto.classId,
      priority: createSupportTicketDto.priority,
    });
  }

  async getSupportTicketById(id: string) {
    const request = await this.findOne({
      where: { id },
      relations: [
        'supportTicket',
        'creator',
        'requester',
        'approver',
        'supportTicket.class',
      ],
    });

    if (!request) {
      throw new NotFoundException('Support ticket request not found');
    }

    return request;
  }

  async querySupportTickets(
    getRequestDto: GetRequestDto,
    userId: string,
    role: RoleName,
  ) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt:desc',
      priority,
      ...filter
    } = getRequestDto;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('entity')
      .leftJoinAndSelect('entity.supportTicket', 'supportTicket')
      .leftJoinAndSelect('supportTicket.class', 'class')
      .leftJoinAndSelect('entity.creator', 'creator')
      .leftJoinAndSelect('entity.requester', 'requester')
      .leftJoinAndSelect('entity.approver', 'approver')
      .where('entity.type = :type', { type: RequestType.SUPPORT_TICKET });

    switch (role) {
      case RoleName.ADMIN:
        break;
      case RoleName.MANAGE:
        const teacherIds = await this.getFieldTeacherIds(userId);
        if (teacherIds.length > 0) {
          queryBuilder.andWhere(
            '(entity.creatorId IN (:...teacherIds) OR entity.requesterId = :userId)',
            {
              teacherIds,
              userId,
            },
          );
        } else {
          queryBuilder.andWhere('entity.requesterId = :userId', { userId });
        }
        break;
      case RoleName.TEACHER_FULL_TIME:
      case RoleName.TEACHER_PART_TIME:
        queryBuilder.andWhere('entity.requesterId = :userId', { userId });
        break;
    }

    if (priority) {
      queryBuilder.andWhere('supportTicket.priority = :priority', { priority });
    }

    const metadata = this.repository.metadata;
    this.applyFiltering(queryBuilder, filter, metadata);
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

  async updateSupportTicket(
    id: string,
    updateData: Partial<CreateSupportTicketRequestDto>,
  ) {
    const request = await this.findOne({
      where: { id, type: RequestType.SUPPORT_TICKET },
      relations: ['supportTicket'],
    });

    if (!request) {
      throw new NotFoundException('Support ticket not found');
    }

    // Only allow updates for PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending tickets can be updated');
    }

    // Update request basic info
    const updatedRequest = await this.store({
      ...request,
      name: updateData.name || request.name,
      description: updateData.description || request.description,
    });

    // Update support ticket specific info
    if (request.supportTicket) {
      await this.supportTicketService.update(request.supportTicket.id, {
        classId: updateData.classId || request.supportTicket.classId,
        priority: updateData.priority || request.supportTicket.priority,
      });
    }

    return updatedRequest;
  }

  async updateSupportTicketStatus(
    id: string,
    action: RequestAction,
    userId?: string,
  ) {
    const request = await this.findOne({
      where: { id, type: RequestType.SUPPORT_TICKET },
      relations: ['supportTicket', 'requester', 'supportTicket.class'],
    });

    if (!request) {
      throw new NotFoundException('Support ticket not found');
    }

    if (action === RequestAction.APPROVE) {
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending tickets can be approved');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for approval');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.APPROVED,
        approverId: userId,
      });

      // Send notification via RabbitMQ
      if (request.requester) {
        const className = request.supportTicket?.class?.name || 'your class';
        const notificationTitle = 'Support Ticket Approved';
        const notificationContent = `Your support ticket "${request.name}" for ${className} has been approved.`;

        // Send email notification
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );

        // Send web notification
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.REJECT) {
      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Only pending tickets can be rejected');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for rejection');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.REJECTED,
        approverId: userId,
      });

      // Send notification via RabbitMQ
      if (request.requester) {
        const className = request.supportTicket?.class?.name || 'your class';
        const notificationTitle = 'Support Ticket Rejected';
        const notificationContent = `Your support ticket "${request.name}" for ${className} has been rejected.`;

        // Send email notification
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );

        // Send web notification
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    } else if (action === RequestAction.CANCEL) {
      if (request.status !== RequestStatus.APPROVED) {
        throw new BadRequestException('Only approved tickets can be canceled');
      }

      // Update request status
      const updatedRequest = await this.store({
        ...request,
        status: RequestStatus.CANCELED,
      });

      // Send notification via RabbitMQ
      if (request.requester) {
        const className = request.supportTicket?.class?.name || 'your class';
        const notificationTitle = 'Support Ticket Canceled';
        const notificationContent = `Your support ticket "${request.name}" for ${className} has been canceled.`;

        // Send email notification
        this.rabbitMQService.sendEmailNotification(
          request.requester.email,
          notificationTitle,
          notificationContent,
        );

        // Send web notification
        this.rabbitMQService.sendWebNotification(request.requester.id, {
          title: notificationTitle,
          content: notificationContent,
        });
      }

      return updatedRequest;
    }

    throw new BadRequestException(
      `Invalid action: ${action}. Must be one of: ${Object.values(RequestAction).join(', ')}`,
    );
  }

  // Delete Support Ticket request
  async deleteSupportTicket(id: string, userId: string) {
    const request = await this.findOne({
      where: { id, type: RequestType.SUPPORT_TICKET },
      relations: ['supportTicket', 'creator'],
    });

    if (!request) {
      throw new NotFoundException('Support ticket not found');
    }

    // Only allow deleting PENDING requests
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending tickets can be deleted');
    }

    // Ensure only the creator can delete their own request
    if (request.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own requests');
    }

    // Delete associated support ticket first
    if (request.supportTicket) {
      await this.supportTicketService.delete(request.supportTicket.id);
    }

    // Delete the request
    await this.requestRepository.remove(request);
  }
}
