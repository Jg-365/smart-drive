import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/request-with-user';
import { ExportService } from './export.service';

@UseGuards(AuthGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportService: ExportService) {}

  @Get('trips/:id/json')
  exportTripJson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.exportService.exportTripJson(user.id, id);
  }
}
