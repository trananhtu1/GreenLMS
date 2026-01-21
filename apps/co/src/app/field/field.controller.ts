import {
  CreateFieldDto,
  FieldDto,
  Pagination,
  QueryFieldDto,
  ResponseDto,
  RoleName,
  Roles,
  UpdateFieldDto,
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
import { FieldService } from './field.service';

@Controller('fields')
export class FieldController {
  constructor(private readonly fieldService: FieldService) {}

  @Get('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async find(@Query() queryFieldDto: QueryFieldDto) {
    const { page, limit, total, data } = await this.fieldService.query(
      queryFieldDto,
      {
        relations: ['leader', 'leader.detail'],
      },
    );

    const results: Pagination<FieldDto> = {
      page,
      limit,
      total,
      items: FieldDto.plainToInstance(data, ['admin']),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async findById(@Param('id') id: string) {
    const field = await this.fieldService.findById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      FieldDto.plainToInstance(field, ['admin']),
    );
  }

  @Post('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async create(@Body() createFieldDto: CreateFieldDto) {
    const field = await this.fieldService.create(createFieldDto);

    return new ResponseDto(
      HttpStatus.CREATED,
      'Created a new field',
      FieldDto.plainToInstance(field, ['admin']),
    );
  }

  @Put('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async updateById(
    @Param('id') id: string,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    const field = await this.fieldService.updateById(id, updateFieldDto);

    return new ResponseDto(
      HttpStatus.OK,
      'Updated a field',
      FieldDto.plainToInstance(field, ['admin']),
    );
  }

  @Delete('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async deleteById(@Param('id') id: string) {
    await this.fieldService.deleteById(id);

    return new ResponseDto(HttpStatus.OK, 'Deleted a field');
  }
}
