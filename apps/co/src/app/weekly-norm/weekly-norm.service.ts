import {
  GetWeeklyNormDto,
  RoleName,
  UserStatus,
  WeeklyNormEntity,
} from '@class-operation/libs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BaseService } from '../../common';

@Injectable()
export class WeeklyNormService extends BaseService<WeeklyNormEntity> {
  constructor(
    @InjectRepository(WeeklyNormEntity)
    private readonly weeklyNormRepository: Repository<WeeklyNormEntity>,
  ) {
    super(weeklyNormRepository);
  }

  async findById(id: string): Promise<WeeklyNormEntity> {
    const weeklyNorm = await this.findOne({
      where: { id },
      relations: ['request'],
    });

    if (!weeklyNorm) {
      throw new NotFoundException('Weekly norm not found');
    }

    return weeklyNorm;
  }

  async updateById(
    id: string,
    updateData: Partial<WeeklyNormEntity>,
  ): Promise<WeeklyNormEntity> {
    const weeklyNorm = await this.findById(id);

    const updatedWeeklyNorm = await this.store({
      ...weeklyNorm,
      ...updateData,
    });

    return updatedWeeklyNorm;
  }

  async cancelById(id: string): Promise<WeeklyNormEntity> {
    const weeklyNorm = await this.findById(id);

    const canceledWeeklyNorm = await this.store({
      ...weeklyNorm,
      status: UserStatus.BLOCKED,
    });

    return canceledWeeklyNorm;
  }

  async updateMany(
    ids: string[],
    updateData: Partial<WeeklyNormEntity>,
  ): Promise<void> {
    await this.weeklyNormRepository
      .createQueryBuilder()
      .update(WeeklyNormEntity)
      .set(updateData)
      .whereInIds(ids)
      .execute();
  }

  async findByRangeDate(
    query: GetWeeklyNormDto,
    userId: string,
    role: RoleName,
  ) {
    switch (role) {
      case RoleName.ADMIN:
      case RoleName.MANAGE:
        break;
      case RoleName.TEACHER_FULL_TIME:
      case RoleName.TEACHER_PART_TIME:
        query.teacherId = userId;
        break;
    }

    const { startDate, endDate, teacherId } = query;
    if (!teacherId) {
      throw new NotFoundException('Teacher ID is required');
    }

    return this.weeklyNormRepository.find({
      where: {
        teacherId,
        startDate: Between(new Date(startDate), new Date(endDate)),
        endDate: Between(new Date(startDate), new Date(endDate)),
        status: UserStatus.ACTIVE,
      },
      order: {
        startDate: 'ASC',
      },
    });
  }

  async checkOverlappingNorms(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string,
  ): Promise<boolean> {
    const query = this.weeklyNormRepository
      .createQueryBuilder('weeklyNorm')
      .where('weeklyNorm.teacherId = :teacherId', { teacherId })
      .andWhere('weeklyNorm.status = :status', {
        status: UserStatus.ACTIVE,
      })
      .andWhere(
        '(weeklyNorm.startDate <= :endDate AND weeklyNorm.endDate >= :startDate)',
        { startDate, endDate },
      );

    if (excludeRequestId) {
      query.andWhere('weeklyNorm.requestId != :requestId', {
        requestId: excludeRequestId,
      });
    }

    const overlappingNorms = await query.getCount();
    return overlappingNorms > 0;
  }

  async deleteByRequestId(requestId: string): Promise<void> {
    await this.weeklyNormRepository.delete({ requestId });
  }
}
