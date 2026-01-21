import { CounterType, RoomEntity } from '@class-operation/libs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common';
import { CounterService } from '../counter/counter.service';

@Injectable()
export class RoomService extends BaseService<RoomEntity> {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    private readonly counterService: CounterService,
  ) {
    super(roomRepository);
  }

  async findById(id: string): Promise<RoomEntity> {
    const room = await this.findOne({ where: { id } });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async findByCode(code: string): Promise<RoomEntity | null> {
    const room = await this.roomRepository.findOne({ where: { code } });
    return room;
  }

  async create(createRoomDto: any): Promise<RoomEntity> {
    if (createRoomDto.code) {
      const existingRoom = await this.findByCode(createRoomDto.code);
      if (existingRoom) {
        throw new BadRequestException('Room with this code already exists');
      }
    } else {
      createRoomDto.code = await this.counterService.getNextCode(
        CounterType.PH,
      );
    }

    return this.store(createRoomDto);
  }

  async updateById(id: string, updateRoomDto: any): Promise<RoomEntity> {
    const room = await this.findById(id);

    // Don't allow code to be changed if specified
    if (updateRoomDto.code && updateRoomDto.code !== room.code) {
      const existingRoom = await this.findByCode(updateRoomDto.code);
      if (existingRoom && existingRoom.id !== id) {
        throw new BadRequestException('Room with this code already exists');
      }
    }

    return this.store({
      ...room,
      ...updateRoomDto,
    });
  }

  async deleteById(id: string): Promise<RoomEntity> {
    const room = await this.findById(id);

    await this.delete(id);

    return room;
  }
}
