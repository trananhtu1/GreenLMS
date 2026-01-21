import {
  CreateTeachingSchedulesDto,
  GetScheduleDto,
  RoleName,
  ScheduleEntity,
  ScheduleType,
  StudentClassEntity,
  UserStatus,
} from '@class-operation/libs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import { BaseService } from '../../common';
import { ClassService } from '../class/class.service';

@Injectable()
export class ScheduleService extends BaseService<ScheduleEntity> {
  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly scheduleRepository: Repository<ScheduleEntity>,
    @InjectRepository(StudentClassEntity)
    private readonly studentClassRepository: Repository<StudentClassEntity>,
    private readonly classService: ClassService,
  ) {
    super(scheduleRepository);
  }

  async findById(id: string): Promise<ScheduleEntity> {
    const schedule = await this.findOne({
      where: { id },
      relations: ['request'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async updateById(
    id: string,
    updateData: Partial<ScheduleEntity>,
  ): Promise<ScheduleEntity> {
    const schedule = await this.findById(id);

    const updatedSchedule = await this.store({
      ...schedule,
      ...updateData,
    });

    return updatedSchedule;
  }

  async cancelById(id: string): Promise<ScheduleEntity> {
    const schedule = await this.findById(id);

    const canceledSchedule = await this.store({
      ...schedule,
      status: false,
    });

    return canceledSchedule;
  }

  async updateMany(
    ids: string[],
    updateData: Partial<ScheduleEntity>,
  ): Promise<void> {
    await this.scheduleRepository
      .createQueryBuilder()
      .update(ScheduleEntity)
      .set(updateData)
      .whereInIds(ids)
      .execute();
  }

  async findByRangeDate(query: GetScheduleDto, userId: string, role: RoleName) {
    // Set teacherId based on role
    if (
      [RoleName.TEACHER_FULL_TIME, RoleName.TEACHER_PART_TIME].includes(role)
    ) {
      query.teacherId = userId;
    }

    const { startDate, endDate, teacherId, name, type } = query;

    // Build query conditions
    const conditions: FindOptionsWhere<ScheduleEntity> = {
      startDate: Between(new Date(startDate), new Date(endDate)),
      endDate: Between(new Date(startDate), new Date(endDate)),
      status: UserStatus.ACTIVE,
    };

    // Add teacherId condition if provided
    if (teacherId) {
      conditions.teacherId = teacherId;
    }

    // Add name filter if provided (case insensitive partial match)
    if (name) {
      conditions.name = ILike(`%${name}%`);
    }

    // Add type filter if provided
    if (type) {
      conditions.type = type;
    }

    return this.scheduleRepository.find({
      where: conditions,
      relations: ['request', 'class', 'class.room'],
    });
  }

  async checkOverlappingSchedules(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string,
  ): Promise<boolean> {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.teacherId = :teacherId', { teacherId })
      .andWhere('schedule.status = :status', {
        status: UserStatus.ACTIVE,
      })
      .andWhere(
        '(schedule.startDate <= :endDate AND schedule.endDate >= :startDate)',
        { startDate, endDate },
      );

    if (excludeRequestId) {
      query.andWhere('schedule.requestId != :requestId', {
        requestId: excludeRequestId,
      });
    }

    const overlappingSchedules = await query.getCount();
    return overlappingSchedules > 0;
  }

  async deleteByRequestId(requestId: string): Promise<void> {
    await this.scheduleRepository.delete({ requestId });
  }

  async createTeachingSchedules(createDto: CreateTeachingSchedulesDto) {
    const { classId, schedules } = createDto;

    // Find the class
    const classEntity = await this.classService.findById(classId);

    // Use provided teacherId if available, otherwise use the class's teacher
    const teacherId = classEntity.teacherId;

    // Validate teacher exists
    if (!teacherId) {
      throw new BadRequestException(
        'Teacher ID must be provided or the class must have an assigned teacher',
      );
    }

    const createdSchedules: ScheduleEntity[] = [];

    for (const scheduleDto of schedules) {
      const { name, description, startDate, endDate } = scheduleDto;
      const scheduleStartDate = new Date(startDate);
      const scheduleEndDate = new Date(endDate);

      // Check for overlapping schedules
      const hasOverlap = await this.checkOverlappingSchedules(
        teacherId,
        scheduleStartDate,
        scheduleEndDate,
      );

      if (hasOverlap) {
        throw new BadRequestException(
          `Schedule "${name}" overlaps with existing schedules for this teacher`,
        );
      }

      const savedSchedule = await this.store({
        name,
        description,
        startDate: scheduleStartDate,
        endDate: scheduleEndDate,
        teacherId,
        classId,
        type: ScheduleType.TEACHING,
      });
      createdSchedules.push(savedSchedule);
    }

    return createdSchedules;
  }

  async findByStudentClasses(query: GetScheduleDto, userId: string) {
    const { startDate, endDate, name, type } = query;

    // Get all class IDs where the user is a student
    const studentClasses = await this.studentClassRepository.find({
      where: {
        studentId: userId,
        status: UserStatus.ACTIVE,
      },

      select: ['classId'],
    });

    const classIds = studentClasses.map((sc) => sc.classId);

    // If student isn't enrolled in any classes, return empty array
    if (classIds.length === 0) {
      return [];
    }

    // Build query conditions
    const conditions: FindOptionsWhere<ScheduleEntity> = {
      startDate: Between(new Date(startDate), new Date(endDate)),
      endDate: Between(new Date(startDate), new Date(endDate)),
      status: UserStatus.ACTIVE,
      classId: In(classIds),
    };

    // Add name filter if provided
    if (name) {
      conditions.name = ILike(`%${name}%`);
    }

    // Add type filter if provided (default to teaching schedules)
    conditions.type = type || ScheduleType.TEACHING;

    return this.scheduleRepository.find({
      where: conditions,
      relations: ['class', 'class.course', 'class.room'],
    });
  }
}
