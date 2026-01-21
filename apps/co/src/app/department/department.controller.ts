import {
  CreateDepartmentDto,
  DepartmentDto,
  Pagination,
  QueryDepartmentDto,
  ResponseDto,
  RoleName,
  Roles,
  UpdateDepartmentDto,
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
import { DepartmentService } from './department.service';

@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async find(@Query() queryParams: QueryDepartmentDto) {
    const { page, limit, total, data } =
      await this.departmentService.query(queryParams);

    const results: Pagination<DepartmentDto> = {
      page,
      limit,
      total,
      items: DepartmentDto.plainToInstance(data),
    };

    return new ResponseDto(HttpStatus.OK, 'Success', results);
  }

  @Get('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async findById(@Param('id') id: string) {
    const department = await this.departmentService.findById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      DepartmentDto.plainToInstance(department),
    );
  }

  @Post('/')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    const department = await this.departmentService.create(createDepartmentDto);

    return new ResponseDto(
      HttpStatus.CREATED,
      'Created a new department',
      DepartmentDto.plainToInstance(department),
    );
  }

  @Put('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async updateById(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentService.updateById(
      id,
      updateDepartmentDto,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Updated a department',
      DepartmentDto.plainToInstance(department),
    );
  }

  @Delete('/:id')
  @Roles(RoleName.ADMIN, RoleName.STAFF_GENERAL)
  async deleteById(@Param('id') id: string) {
    await this.departmentService.deleteById(id);

    return new ResponseDto(HttpStatus.OK, 'Deleted a department');
  }
}
