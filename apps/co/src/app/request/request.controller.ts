import {
  CreateBusySchedulesRequestDto,
  CreateSupportTicketRequestDto,
  CreateTimeOffRequestDto,
  CreateWeeklyNormRequestDto,
  GetRequestDto,
  RequestAction,
  RequestDto,
  ResponseDto,
  RoleName,
  Roles,
  UpdateBusySchedulesRequestDto,
  UpdateTimeOffRequestDto,
  UpdateWeeklyNormRequestDto,
  User,
} from '@class-operation/libs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { WeeklyNormService } from '../weekly-norm/weekly-norm.service';
import { RequestService } from './request.service';

@Controller('requests')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly weeklyNormService: WeeklyNormService,
  ) {}

  @Post('weekly-norms')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async createWeekNorm(
    @User('userId') userId: string,
    @User('role') role: RoleName,
    @Body() requestDto: CreateWeeklyNormRequestDto,
  ) {
    const request = await this.requestService.createWeeklyNorms(
      requestDto,
      userId,
      role,
    );

    return new ResponseDto(
      HttpStatus.CREATED,
      'Request created successfully',
      request,
    );
  }

  @Get('weekly-norms')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async findWeeklyNorms(
    @Query() getRequestDto: GetRequestDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    const { page, limit, total, data } =
      await this.requestService.queryWeeklyNorms(getRequestDto, userId, role);

    return new ResponseDto(HttpStatus.OK, 'Success', {
      page,
      limit,
      total,
      items: RequestDto.plainToInstance(data, ['admin']),
    });
  }

  @Get('weekly-norms/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async findWeeklyNormById(@Param('id') id: string) {
    const request = await this.requestService.findOne({
      where: { id },
      relations: ['weeklyNorms', 'creator', 'requester', 'approver'],
    });

    if (!request) {
      throw new NotFoundException('Weekly norm request not found');
    }

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      RequestDto.plainToInstance(request, ['admin']),
    );
  }

  @Put('weekly-norms/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async updateWeeklyNormById(
    @Param('id') id: string,
    @Body() updateData: UpdateWeeklyNormRequestDto,
    @User('role') role: RoleName,
  ) {
    const updatedRequest = await this.requestService.updateWeeklyNorm(
      id,
      updateData,
      role,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Weekly norm request updated successfully',
      updatedRequest,
    );
  }

  @Patch('weekly-norms/:id/status')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async updateWeeklyNormStatus(
    @Param('id') id: string,
    @User('userId') userId: string,
    @Body('action') action: RequestAction,
  ) {
    const updatedRequest = await this.requestService.updateWeeklyNormStatus(
      id,
      action,
      userId,
    );

    return new ResponseDto(
      HttpStatus.OK,
      `Weekly norm request ${action} successfully`,
      updatedRequest,
    );
  }

  @Delete('weekly-norms/:id')
  async deleteWeeklyNorm(
    @Param('id') id: string,
    @User('userId') userId: string,
  ) {
    await this.requestService.deleteWeeklyNorm(id, userId);

    return new ResponseDto(HttpStatus.OK, 'Weekly norm request deleted');
  }

  @Post('time-offs')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.TEACHER_PART_TIME)
  async createTimeOff(
    @User('userId') userId: string,
    @User('role') role: RoleName,
    @Body() timeOffDto: CreateTimeOffRequestDto,
  ) {
    const result = await this.requestService.createTimeOffSchedule(
      timeOffDto,
      userId,
      role,
    );

    return new ResponseDto(
      HttpStatus.CREATED,
      'Time off schedule request created successfully',
      result.request,
    );
  }

  @Get('time-offs')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.TEACHER_PART_TIME)
  async findTimeOff(
    @Query() getRequestDto: GetRequestDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    const { page, limit, total, data } =
      await this.requestService.queryTimeOffRequests(
        getRequestDto,
        userId,
        role,
      );
    return new ResponseDto(HttpStatus.OK, 'Success', {
      page,
      limit,
      total,
      items: RequestDto.plainToInstance(data, ['admin']),
    });
  }

  @Get('time-offs/:id')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.TEACHER_PART_TIME)
  async findTimeOffById(@Param('id') id: string) {
    const request = await this.requestService.getTimeOffScheduleById(id);
    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      RequestDto.plainToInstance(request, ['admin']),
    );
  }

  @Put('time-offs/:id')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.TEACHER_PART_TIME)
  async updateTimeOffById(
    @Param('id') id: string,
    @Body() updateData: UpdateTimeOffRequestDto,
  ) {
    const updatedRequest = await this.requestService.updateTimeOffSchedule(
      id,
      updateData,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Time off schedule request updated successfully',
      updatedRequest,
    );
  }

  @Patch('time-offs/:id/status')
  @Roles(RoleName.ADMIN, RoleName.MANAGE)
  async updateTimeOffStatus(
    @Param('id') id: string,
    @User('userId') userId: string,
    @Body('action') action: RequestAction,
  ) {
    const updatedRequest = await this.requestService.updateTimeOffStatus(
      id,
      action,
      userId,
    );

    return new ResponseDto(
      HttpStatus.OK,
      `Time off schedule request ${action} successfully`,
      updatedRequest,
    );
  }

  @Delete('time-offs/:id')
  async deleteTimeOff(@Param('id') id: string, @User('userId') userId: string) {
    await this.requestService.deleteTimeOff(id, userId);

    return new ResponseDto(HttpStatus.OK, 'Time off schedule request deleted');
  }

  @Post('busy-schedules')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async createBusySchedule(
    @User('userId') userId: string,
    @User('role') role: RoleName,
    @Body() busySchedulesDto: CreateBusySchedulesRequestDto,
  ) {
    const result = await this.requestService.createBusySchedule(
      busySchedulesDto,
      userId,
      role,
    );

    return new ResponseDto(
      HttpStatus.CREATED,
      'Busy schedule request created successfully',
      result.request,
    );
  }

  @Get('busy-schedules')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async findBusySchedule(
    @Query() getRequestDto: GetRequestDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    const { page, limit, total, data } =
      await this.requestService.queryBusyScheduleRequests(
        getRequestDto,
        userId,
        role,
      );

    return new ResponseDto(HttpStatus.OK, 'Success', {
      page,
      limit,
      total,
      items: RequestDto.plainToInstance(data, ['admin']),
    });
  }

  @Get('busy-schedules/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.TEACHER_PART_TIME,
    RoleName.MANAGE,
    RoleName.TEACHER_FULL_TIME,
  )
  async getBusyScheduleById(@Param('id') id: string) {
    const request = await this.requestService.getBusyScheduleById(id);
    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      RequestDto.plainToInstance(request, ['admin']),
    );
  }

  @Put('busy-schedules/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async updateBusySchedule(
    @Param('id') id: string,
    @Body() updateData: UpdateBusySchedulesRequestDto,
  ) {
    const updatedRequest = await this.requestService.updateBusySchedule(
      id,
      updateData,
    );
    return new ResponseDto(
      HttpStatus.OK,
      'Busy schedule request updated successfully',
      updatedRequest,
    );
  }

  @Patch('busy-schedules/:id/status')
  @Roles(RoleName.ADMIN, RoleName.MANAGE)
  async updateBusyScheduleStatus(
    @Param('id') id: string,
    @User('userId') userId: string,
    @Body('action') action: RequestAction,
  ) {
    const updatedRequest = await this.requestService.updateBusyScheduleStatus(
      id,
      action,
      userId,
    );

    return new ResponseDto(
      HttpStatus.OK,
      `Busy schedule request ${action} successfully`,
      updatedRequest,
    );
  }

  @Delete('busy-schedules/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  )
  async deleteBusySchedule(
    @Param('id') id: string,
    @User('userId') userId: string,
  ) {
    await this.requestService.deleteBusySchedule(id, userId);

    return new ResponseDto(HttpStatus.OK, 'Busy schedule request deleted');
  }

  @Post('support-tickets')
  @Roles(
    RoleName.ADMIN,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
    RoleName.RECEPTIONIST,
  )
  createSupportTicket(
    @Body() createSupportTicketDto: CreateSupportTicketRequestDto,
    @User('userId') userId: string,
    @User('role') role: RoleName,
  ) {
    return this.requestService.createSupportTicket(
      createSupportTicketDto,
      userId,
      role,
    );
  }

  @Get('support-tickets')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
    RoleName.RECEPTIONIST,
  )
  async getAllSupportTickets(
    @Query() getRequestDto: GetRequestDto,
    @User('role') role: RoleName,
    @User('userId') userId: string,
  ) {
    const { page, limit, total, data } =
      await this.requestService.querySupportTickets(
        getRequestDto,
        userId,
        role,
      );

    return new ResponseDto(HttpStatus.OK, 'Success', {
      page,
      limit,
      total,
      items: RequestDto.plainToInstance(data, ['admin']),
    });
  }

  @Put('support-tickets/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_PART_TIME,
    RoleName.TEACHER_FULL_TIME,
  )
  async updateSupportTicket(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateSupportTicketRequestDto>,
  ) {
    const updatedRequest = await this.requestService.updateSupportTicket(
      id,
      updateData,
    );

    return new ResponseDto(
      HttpStatus.OK,
      'Support ticket updated successfully',
      updatedRequest,
    );
  }

  @Patch('support-tickets/:id/status')
  @Roles(RoleName.ADMIN, RoleName.MANAGE, RoleName.RECEPTIONIST)
  async updateSupportTicketStatus(
    @Param('id') id: string,
    @User('userId') userId: string,
    @Body('action') action: RequestAction,
  ) {
    const updatedRequest = await this.requestService.updateSupportTicketStatus(
      id,
      action,
      userId,
    );

    return new ResponseDto(
      HttpStatus.OK,
      `Support ticket ${action.toLowerCase()} successfully`,
      updatedRequest,
    );
  }

  @Delete('support-tickets/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.RECEPTIONIST,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
  )
  async deleteSupportTicket(
    @Param('id') id: string,
    @User('userId') userId: string,
  ) {
    await this.requestService.deleteSupportTicket(id, userId);

    return new ResponseDto(HttpStatus.OK, 'Support ticket deleted');
  }

  @Get('support-tickets/:id')
  @Roles(
    RoleName.ADMIN,
    RoleName.MANAGE,
    RoleName.TEACHER_FULL_TIME,
    RoleName.TEACHER_PART_TIME,
    RoleName.RECEPTIONIST,
  )
  async getSupportTicketById(@Param('id') id: string) {
    const request = await this.requestService.getSupportTicketById(id);

    return new ResponseDto(
      HttpStatus.OK,
      'Success',
      RequestDto.plainToInstance(request, ['admin']),
    );
  }
}
