import {
  CreateRoomDto,
  Pagination,
  QueryRoomDto,
  ResponseDto,
  RoleName,
  Roles,
  RoomDto,
  UpdateRoomDto,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL, RoleName.STAFF_ACADEMIC)
  async find(@Query() queryParams: QueryRoomDto) {
    const {
      page,
      limit,
      total,
      data: rooms,
    } = await this.roomService.query(queryParams);

    const results: Pagination<RoomDto> = {
      page,
      limit,
      total,
      items: RoomDto.plainToInstance(rooms, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async findById(@Param('id') id: string) {
    const room = await this.roomService.findById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      RoomDto.plainToInstance(room, ['admin']),
    );
  }

  @Post('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async create(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomService.create(
      CreateRoomDto.plainToClass(createRoomDto),
    );

    return new ResponseDto(
      HttpStatus.CREATED,
      'Created a new room',
      RoomDto.plainToInstance(room, ['admin']),
    );
  }

  @Put('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async updateById(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    const room = await this.roomService.updateById(
      id,
      UpdateRoomDto.plainToClass(updateRoomDto),
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Updated a room',
      RoomDto.plainToInstance(room, ['admin']),
    );
  }

  @Delete('/:id')
  @Roles(RoleName.ADMIN)
  async deleteById(@Param('id') id: string) {
    await this.roomService.deleteById(id);

    return new ResponseDto(HttpStatus.OK, 'Deleted a room');
  }
}
