import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExportsController } from './exports.controller';
import { ExportService } from './export.service';

@Module({
  imports: [AuthModule],
  controllers: [ExportsController],
  providers: [ExportService],
})
export class ExportsModule {}
