import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/request-with-user';
import { EndTripDto } from './dto/end-trip.dto';
import { StartTripDto } from './dto/start-trip.dto';
import { TripsService } from './trips.service';
import { TelemetryQueryService } from '../telemetry/telemetry-query.service';

@UseGuards(AuthGuard)
@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly telemetryQueryService: TelemetryQueryService,
  ) {}

  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartTripDto) {
    return this.tripsService.start(user.id, dto);
  }

  @Post(':id/finish')
  finish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: EndTripDto,
  ) {
    return this.tripsService.finish(user.id, id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findOne(user.id, id);
  }

  @Get(':id/summary')
  summary(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findSummary(user.id, id);
  }

  @Get(':id/route')
  route(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findRoute(user.id, id);
  }

  @Get(':id/events')
  events(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findEvents(user.id, id);
  }

  @Get(':id/telemetry')
  async telemetry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(100), ParseIntPipe) pageSize: number,
  ) {
    await this.tripsService.findOwnedTrip(user.id, id);
    return this.telemetryQueryService.findTripTelemetry(id, page, pageSize);
  }
}
