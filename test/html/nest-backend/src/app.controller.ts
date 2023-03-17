import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('init')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/index.html')
  getIndex(): string {
    return 'Hello Index!';
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Post()
}
