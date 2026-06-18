import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { StartDemoDto } from './dto/start-demo.dto';
import { DemoService } from './demo.service';
import type {
  DemoCurrentResponse,
  DemoSessionResponse,
} from './demo.service';

/**
 * Painel de controle do modo demo (JOA-RF-05). O frontend consome /api/demo/*
 * (lib/api/demo.ts). O start dirige o simulador ao vivo pelo gateway.
 */
@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  start(@Body() dto: StartDemoDto): DemoSessionResponse {
    return this.demo.start(dto.scenario, dto.vehicleId);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  reset(): { reset: true; sessionId: string } {
    return this.demo.reset();
  }

  @Get('current')
  current(): DemoCurrentResponse {
    return this.demo.current();
  }
}
