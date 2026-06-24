import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { DemoService } from './demo.service';
import { StartDemoDto } from './dto/start-demo.dto';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  start(@Body() dto: StartDemoDto) {
    return this.demoService.start(dto);
  }

  @Post('reset')
  reset() {
    return this.demoService.reset();
  }

  @Get('current')
  current() {
    return this.demoService.current();
  }
}
