import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/request-with-user';
import { EndTripDto } from './dto/end-trip.dto';
import { StartTripDto } from './dto/start-trip.dto';
import { TripsService } from './trips.service';

@UseGuards(AuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartTripDto) {
    return this.tripsService.start(user.id, dto);
  }

  @Post(':id/end')
  end(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: EndTripDto,
  ) {
    return this.tripsService.end(user.id, id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findOne(user.id, id);
  }

  @Get(':id/points')
  points(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findTelemetryPoints(user.id, id);
  }

  @Get(':id/events')
  events(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.findEvents(user.id, id);
  }
}
